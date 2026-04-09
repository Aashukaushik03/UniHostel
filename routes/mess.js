const express      = require('express');
const router       = express.Router();
const MessMenu     = require('../models/MessMenu');
const MessFeedback = require('../models/MessFeedback');
const MessOptOut   = require('../models/MessOptOut');
const { protect, adminOnly } = require('../middleware/auth');

// Helper: get Monday of current week
function getWeekStart(date = new Date()) {
  const d   = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];


// ═══════════════════════════════════════════════════════
// GET current week menu (students + admin)
// GET /api/mess/menu
// ═══════════════════════════════════════════════════════
router.get('/menu', protect, async (req, res) => {
  try {
    const weekStart = getWeekStart();
    let menu = await MessMenu.findOne({ weekStart });

    // If no menu exists for this week, return empty template
    if (!menu) {
      return res.json({
        success: true,
        menu: null,
        weekStart,
        message: 'No menu set for this week yet.'
      });
    }

    res.json({ success: true, menu, weekStart });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ═══════════════════════════════════════════════════════
// ADMIN: Create / update this week's menu
// POST /api/mess/menu
// ═══════════════════════════════════════════════════════
router.post('/menu', protect, adminOnly, async (req, res) => {
  try {
    const weekStart = getWeekStart();
    const menuData  = { updatedBy: req.user._id, updatedAt: new Date() };

    // Pick only valid day keys from request body
    DAYS.forEach(day => {
      if (req.body[day]) menuData[day] = req.body[day];
    });

    const menu = await MessMenu.findOneAndUpdate(
      { weekStart },
      { ...menuData, weekStart },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'Menu updated successfully!', menu });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ═══════════════════════════════════════════════════════
// STUDENT: Submit meal feedback / rating
// POST /api/mess/feedback
// Body: { mealType, date, rating, comment }
// ═══════════════════════════════════════════════════════
router.post('/feedback', protect, async (req, res) => {
  try {
    const { mealType, date, rating, comment } = req.body;

    if (!mealType || !date || !rating) {
      return res.status(400).json({ success: false, message: 'Meal type, date and rating are required' });
    }

    const feedback = await MessFeedback.create({
      student:     req.user._id,
      studentName: req.user.name,
      mealType,
      date:        new Date(date),
      rating:      Number(rating),
      comment:     comment || ''
    });

    res.status(201).json({ success: true, message: 'Feedback submitted! Thank you.', feedback });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already submitted feedback for this meal today.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});


// ═══════════════════════════════════════════════════════
// ADMIN: Get all feedback with average ratings
// GET /api/mess/feedback
// ═══════════════════════════════════════════════════════
router.get('/feedback', protect, adminOnly, async (req, res) => {
  try {
    // Average rating per meal type
    const averages = await MessFeedback.aggregate([
      { $group: {
          _id:    '$mealType',
          avgRating: { $avg: '$rating' },
          count:     { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Recent 20 feedbacks
    const recent = await MessFeedback.find()
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, averages, recent });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ═══════════════════════════════════════════════════════
// STUDENT: Apply for meal opt-out / leave
// POST /api/mess/optout
// ═══════════════════════════════════════════════════════
router.post('/optout', protect, async (req, res) => {
  try {
    const { fromDate, toDate, reason, skipBreakfast, skipLunch, skipSnacks, skipDinner } = req.body;

    if (!fromDate || !toDate || !reason) {
      return res.status(400).json({ success: false, message: 'From date, to date and reason are required' });
    }

    const optout = await MessOptOut.create({
      student:       req.user._id,
      studentName:   req.user.name,
      rollNumber:    req.user.rollNumber,
      roomNumber:    req.user.roomNumber,
      fromDate:      new Date(fromDate),
      toDate:        new Date(toDate),
      reason,
      skipBreakfast: !!skipBreakfast,
      skipLunch:     !!skipLunch,
      skipSnacks:    !!skipSnacks,
      skipDinner:    !!skipDinner,
    });

    res.status(201).json({ success: true, message: 'Meal opt-out request submitted!', optout });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ═══════════════════════════════════════════════════════
// STUDENT: My opt-out history
// GET /api/mess/optout/my
// ═══════════════════════════════════════════════════════
router.get('/optout/my', protect, async (req, res) => {
  try {
    const optouts = await MessOptOut.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, optouts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ═══════════════════════════════════════════════════════
// ADMIN: Get all opt-out requests
// GET /api/mess/optout/all
// ═══════════════════════════════════════════════════════
router.get('/optout/all', protect, adminOnly, async (req, res) => {
  try {
    const optouts = await MessOptOut.find().sort({ createdAt: -1 });
    res.json({ success: true, count: optouts.length, optouts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ═══════════════════════════════════════════════════════
// ADMIN: Approve / reject opt-out
// PUT /api/mess/optout/:id/review
// ═══════════════════════════════════════════════════════
router.put('/optout/:id/review', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const optout = await MessOptOut.findByIdAndUpdate(
      req.params.id,
      { status, adminRemarks: adminRemarks || '' },
      { new: true }
    );

    if (!optout) {
      return res.status(404).json({ success: false, message: 'Opt-out request not found' });
    }

    res.json({ success: true, message: `Opt-out request ${status}`, optout });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
