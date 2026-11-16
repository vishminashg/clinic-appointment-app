const User = require('../models/User');

module.exports = async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId).select('isAdmin');
    if (user?.isAdmin !== true) {
      return res.status(403).json({ message: 'Doctor management requires an admin account' });
    }
    next();
  } catch {
    res.status(500).json({ message: 'Could not check account permissions' });
  }
};
