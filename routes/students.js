const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { protect, adminOnly } = require('../middleware/auth');

// @route GET /api/students
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const students = await Student.find({ role: 'student' }).select('-password').sort({ roomNumber: 1 });
    res.json({ success: true, count: students.length, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/students/profile/update
router.put('/profile/update', protect, async (req, res) => {
  try {
    const { phone, parentName, parentPhone, parentEmail } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.user._id,
      { phone, parentName, parentPhone, parentEmail },
      { new: true }
    ).select('-password');
    res.json({ success: true, message: 'Profile updated', student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/students/attendance/toggle
router.post('/attendance/toggle', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    const now = new Date();
    if (student.currentlyOut) {
      student.currentlyOut = false;
      student.checkInTime = now;
    } else {
      student.currentlyOut = true;
      student.checkOutTime = now;
    }
    await student.save();
    res.json({ 
      success: true, 
      message: student.currentlyOut ? 'Checked out' : 'Checked in', 
      currentlyOut: student.currentlyOut 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/students/:id/status
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const student = await Student.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    ).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, message: 'Student status updated', student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/students/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;