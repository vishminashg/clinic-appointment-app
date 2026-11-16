const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  deleteAppointment,
  getDoctorAppointments,
  decideAppointment
} = require('../controllers/appointmentController');
const protect = require('../middleware/authMiddleware');
const requireDoctor = require('../middleware/doctorMiddleware');

router.post('/', protect, createAppointment);
router.get('/', protect, getMyAppointments);
router.get('/doctor', protect, requireDoctor, getDoctorAppointments);
router.put('/doctor/:id/decision', protect, requireDoctor, decideAppointment);
router.get('/:id', protect, getAppointmentById);
router.put('/:id/status', protect, updateAppointmentStatus);
router.delete('/:id', protect, deleteAppointment);

module.exports = router;
