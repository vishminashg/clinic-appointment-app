const Doctor = require('../models/Doctor');
const User = require('../models/User');

module.exports = async function requireDoctor(req, res, next) {
  const user = await User.findById(req.userId).select('isAdmin');
  if (!user || user.isAdmin) return res.status(403).json({ message: 'A linked doctor account is required' });
  const doctor = await Doctor.findOne({ accountId: user._id });
  if (!doctor) return res.status(403).json({ message: 'A linked doctor account is required' });
  req.doctor = doctor;
  next();
};
