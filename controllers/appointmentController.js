const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { isObjectIdOrHexString } = require('mongoose');

const ownedAppointment = (req) => ({ _id: req.params.id, patientId: req.userId });

// Create a new appointment (book)
const createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, timeSlot, reason } = req.body;
    const patient = await User.findById(req.userId).select('isAdmin');
    if (!patient) return res.status(401).json({ message: 'Sign in to book an appointment' });
    if (patient.isAdmin) return res.status(403).json({ message: 'Only patients can book appointments' });

    if (!doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({ message: 'doctorId, appointmentDate, and timeSlot are required' });
    }
    const parsedDate = new Date(appointmentDate);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    if (typeof appointmentDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate) ||
        !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== appointmentDate ||
        appointmentDate < today) {
      return res.status(400).json({ message: 'Choose a valid appointment date today or later' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
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
    const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    if (!isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }
    const appointment = await Appointment.findOne(ownedAppointment(req));
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = status;
    await appointment.save();

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

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment
};
