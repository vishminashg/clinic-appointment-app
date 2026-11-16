const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { isCalendarDate } = require('../utils/appointment-date');

async function updateScheduleAndAccount(doctor, { availableDates, accountEmail }) {
  if (availableDates !== undefined) {
    const dates = typeof availableDates === 'string'
      ? (availableDates ? availableDates.split(',') : [])
      : availableDates;
    if (!Array.isArray(dates) || !dates.every(isCalendarDate)) {
      return 'Choose valid dates from the calendar';
    }
    doctor.availableDates = [...new Set(dates)].sort();
  }
  if (accountEmail !== undefined) {
    if (typeof accountEmail !== 'string') return 'Enter an existing doctor login email';
    const email = accountEmail.trim();
    if (!email) {
      doctor.accountId = undefined;
    } else {
      const user = await User.findOne({ email }).select('isAdmin');
      if (!user || user.isAdmin) return 'Enter the email of an existing account without admin access';
      const linked = await Doctor.exists({ accountId: user._id, _id: { $ne: doctor._id } });
      if (linked) return 'That account is already linked to a doctor';
      doctor.accountId = user._id;
    }
  }
}

const parseAvailableDays = (availableDays) => {
  if (Array.isArray(availableDays)) return availableDays;
  if (typeof availableDays === 'string' && availableDays.length > 0) return availableDays.split(',');
  return [];
};

// Create a new doctor
const createDoctor = async (req, res) => {
  try {
    const { name, specialization, bio, consultationFee, availableDays } = req.body;

    if (!name || !specialization || !consultationFee) {
      return res.status(400).json({ message: 'Name, specialization, and consultation fee are required' });
    }

    const newDoctor = new Doctor({
      name,
      specialization,
      bio,
      consultationFee,
      availableDays: parseAvailableDays(availableDays),
      profileImage: req.file ? `/uploads/${req.file.filename}` : ''
    });

    const problem = await updateScheduleAndAccount(newDoctor, req.body);
    if (problem) return res.status(400).json({ message: problem });
    await newDoctor.save();
    const { accountId, ...publicDoctor } = newDoctor.toObject();
    res.status(201).json(publicDoctor);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That account is already linked to a doctor' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all doctors
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get one doctor by ID
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a doctor
const updateDoctor = async (req, res) => {
  try {
    const { name, specialization, bio, consultationFee, availableDays } = req.body;

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.name = name || doctor.name;
    doctor.specialization = specialization || doctor.specialization;
    if (bio !== undefined) {
      doctor.bio = bio;
    }
    doctor.consultationFee = consultationFee || doctor.consultationFee;
    if (availableDays !== undefined) {
      doctor.availableDays = parseAvailableDays(availableDays);
    }
    if (req.file) {
      doctor.profileImage = `/uploads/${req.file.filename}`;
    }

    const problem = await updateScheduleAndAccount(doctor, req.body);
    if (problem) return res.status(400).json({ message: problem });
    await doctor.save();
    const { accountId, ...publicDoctor } = doctor.toObject();
    res.status(200).json(publicDoctor);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That account is already linked to a doctor' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a doctor
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    await doctor.deleteOne();
    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createDoctor, getAllDoctors, getDoctorById, updateDoctor, deleteDoctor };
