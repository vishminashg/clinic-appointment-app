const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { isObjectIdOrHexString } = require('mongoose');
const { isCalendarDate, clinicToday } = require('../utils/appointment-date');

const ownedAppointment = (req) => ({ _id: req.params.id, patientId: req.userId });

// Create a new appointment (book)
const createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot, reason } = req.body;
    const patient = await User.findById(req.userId).select('isAdmin');
    if (!patient) return res.status(401).json({ message: 'Sign in to book an appointment' });
    if (patient.isAdmin || await Doctor.exists({ accountId: patient._id })) {
      return res.status(403).json({ message: 'Only patients can book appointments' });
    }

    if (!doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({ message: 'doctorId, appointmentDate, and timeSlot are required' });
    }
    if (!isCalendarDate(appointmentDate) || appointmentDate < clinicToday()) {
      return res.status(400).json({ message: 'Choose a valid appointment date today or later' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.availableDates && !doctor.availableDates.includes(appointmentDate)) {
      return res.status(400).json({ message: 'This doctor is unavailable on that date' });
    }

    // Business logic: block double-booking the same doctor at the same date and time slot
    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate,
      timeSlot,
      status: { $in: ['Pending', 'Confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ message: 'This doctor is already booked for that date and time slot' });
    }

    const newAppointment = new Appointment({
      patientId: req.userId,
      doctorId,
      appointmentDate,
      timeSlot,
      reason
    });

    await newAppointment.save();
    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all appointments belonging to the logged-in user
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.userId })
      .populate('doctorId', 'name specialization consultationFee profileImage');
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get one appointment by ID
const getAppointmentById = async (req, res) => {
  try {
    if (!isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }
    const appointment = await Appointment.findOne(ownedAppointment(req))
      .populate('doctorId', 'name specialization consultationFee profileImage');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update appointment status (confirm, cancel, complete)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 'Cancelled') {
      return res.status(400).json({ message: 'Patients can only cancel appointments' });
    }

    if (!isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }
    const appointment = await Appointment.findOneAndUpdate(
      { ...ownedAppointment(req), status: { $in: ['Pending', 'Confirmed', 'Cancelled'] } },
      { $set: { status } }, { returnDocument: 'after' }
    );
    if (!appointment) {
      if (await Appointment.exists(ownedAppointment(req))) {
        return res.status(409).json({ message: 'This appointment can no longer be cancelled' });
      }
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an appointment
const deleteAppointment = async (req, res) => {
  try {
    if (!isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }
    const appointment = await Appointment.findOneAndDelete(ownedAppointment(req));
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.status(200).json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

async function getDoctorAppointments(req, res) {
  const doctor = req.doctor;
  const appointments = await Appointment.find({ doctorId: doctor._id })
    .select('patientId appointmentDate timeSlot status reason')
    .populate('patientId', 'name')
    .sort({ appointmentDate: 1, _id: 1 });
  res.json({ doctor, appointments });
}

async function decideAppointment(req, res) {
  const { status } = req.body;
  if (!['Confirmed', 'Rejected'].includes(status) || !isObjectIdOrHexString(req.params.id)) {
    return res.status(400).json({ message: 'Choose a valid appointment and decision' });
  }
  const filter = { _id: req.params.id, doctorId: req.doctor._id };
  const appointment = await Appointment.findOneAndUpdate(
    { ...filter, status: 'Pending' }, { $set: { status } }, { returnDocument: 'after' }
  );
  if (!appointment) {
    if (await Appointment.exists(filter)) {
      return res.status(409).json({ message: 'This appointment is no longer pending' });
    }
    return res.status(404).json({ message: 'Appointment not found' });
  }
  res.json({ status: appointment.status });
}

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment,
  getDoctorAppointments,
  decideAppointment
};
