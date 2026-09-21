const Doctor = require('../models/Doctor');

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
      availableDays: availableDays ? availableDays.split(',') : [],
      profileImage: req.file ? `/uploads/${req.file.filename}` : ''
    });

    await newDoctor.save();
    res.status(201).json(newDoctor);
  } catch (error) {
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
    doctor.bio = bio || doctor.bio;
    doctor.consultationFee = consultationFee || doctor.consultationFee;
    if (availableDays) {
      doctor.availableDays = availableDays.split(',');
    }
    if (req.file) {
      doctor.profileImage = `/uploads/${req.file.filename}`;
    }

    await doctor.save();
    res.status(200).json(doctor);
  } catch (error) {
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