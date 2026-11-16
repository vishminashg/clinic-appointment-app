const express = require('express');
const router = express.Router();
const {
  createDoctor,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  getDoctorLogin
} = require('../controllers/doctorController');
const protect = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, requireAdmin, upload.single('profileImage'), createDoctor);
router.get('/', getAllDoctors);
router.get('/:id/login', protect, requireAdmin, getDoctorLogin);
router.get('/:id', getDoctorById);
router.put('/:id', protect, requireAdmin, upload.single('profileImage'), updateDoctor);
router.delete('/:id', protect, requireAdmin, deleteDoctor);

module.exports = router;
