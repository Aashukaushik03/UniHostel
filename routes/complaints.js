const express  = require('express');
const router   = express.Router();
const Complaint = require('../models/Complaint');
const { protect, adminOnly } = require('../middleware/auth');

// ── Student: Submit a complaint ──────────────────────────────
router.post('/submit', protect, async (req, res) => {
  try {
    const { category, title, description, priority } = req.body;
    if (!category || !title || !description) {
      return res.status(400).json({ success: false, message: 'Category, title and description are required.' });
    }
    const complaint = await Complaint.create({
      student:     req.user._id,
      studentName: req.user.name,
      rollNumber:  req.user.rollNumber,
      roomNumber:  req.user.roomNumber,
      category, title, description,
      priority: priority || 'medium'
    });
    res.status(201).json({ success: true, message: 'Complaint submitted successfully.', complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Student: My complaints ───────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: All complaints (optional ?status= filter) ─────────
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const complaints = await Complaint.find(query).sort({ createdAt: -1 });
    res.json({ success: true, complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: Update status + remarks ───────────────────────────
router.put('/:id/update', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;
    const allowed = ['open', 'in_progress', 'resolved', 'closed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const update = { status, adminRemarks };
    if (status === 'resolved') update.resolvedAt = new Date();
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    res.json({ success: true, message: 'Complaint updated.', complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: Stats for dashboard ───────────────────────────────
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const total       = await Complaint.countDocuments();
    const open        = await Complaint.countDocuments({ status: 'open' });
    const in_progress = await Complaint.countDocuments({ status: 'in_progress' });
    const resolved    = await Complaint.countDocuments({ status: 'resolved' });
    res.json({ success: true, stats: { total, open, in_progress, resolved } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;