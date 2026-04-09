const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hostel_secret_key');
    req.user = await Student.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'warden')) {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied. Admin/Warden only.' });
  }
};