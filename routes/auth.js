const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'hostel_secret_key', {
    expiresIn: '7d'
  });
};

// @route POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, roomNumber, rollNumber, course, year, parentName, parentPhone, parentEmail } = req.body;

    const existingStudent = await Student.findOne({ $or: [{ email }, { rollNumber }] });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: 'Student with this email or roll number already exists' });
    }

    // Hash password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const student = await Student.create({
      name, email, password: hashedPassword, phone, roomNumber,
      rollNumber, course, year, parentName, parentPhone, parentEmail
    });

    const token = generateToken(student._id);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        roomNumber: student.roomNumber,
        rollNumber: student.rollNumber
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (student.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact admin.' });
    }

    // Compare password directly with bcrypt
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(student._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        roomNumber: student.roomNumber,
        rollNumber: student.rollNumber
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    res.json({ success: true, student: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/auth/admin-register
router.post('/admin-register', async (req, res) => {
  try {
    const { name, email, password, phone, adminKey } = req.body;

    if (adminKey !== 'HOSTEL_ADMIN_2024') {
      return res.status(403).json({ success: false, message: 'Invalid admin key' });
    }

    const existing = await Student.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Hash password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const admin = await Student.create({
      name,
      email,
      password: hashedPassword,
      phone,
      roomNumber: 'ADMIN',
      rollNumber: `ADM-${Date.now()}`,
      course: 'Administration',
      year: 'N/A',
      parentName: 'N/A',
      parentPhone: 'N/A',
      role: 'admin'
    });

    const token = generateToken(admin._id);
    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      token,
      student: {
        id: admin._id,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// @route PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const student = await Student.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(newPassword, salt);
    await student.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
module.exports = router;