const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const NightOut = require('../models/NightOut');
const { protect, adminOnly } = require('../middleware/auth');

// @route GET /api/admin/dashboard
router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {

    // ── Basic counts ─────────────────────────────────────────────
    const totalStudents    = await Student.countDocuments({ role: 'student' });
    const activeStudents   = await Student.countDocuments({ role: 'student', status: 'active' });
    const studentsOut      = await Student.countDocuments({ role: 'student', currentlyOut: true });
    const pendingNightouts = await NightOut.countDocuments({ status: 'pending' });
    const approvedNightouts= await NightOut.countDocuments({ status: 'approved' });
    const rejectedNightouts= await NightOut.countDocuments({ status: 'rejected' });
    const lateReturns      = await NightOut.countDocuments({ isLateReturn: true });
    const totalNightouts   = await NightOut.countDocuments();

    // ── Last 7 days nightout requests (for line chart) ───────────
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const start = new Date(date.setHours(0, 0, 0, 0));
      const end   = new Date(date.setHours(23, 59, 59, 999));
      const count = await NightOut.countDocuments({ createdAt: { $gte: start, $lte: end } });
      last7Days.push({
        date: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        count
      });
    }

    // ── Nightout by status (for pie/doughnut chart) ──────────────
    const statusBreakdown = {
      pending:  pendingNightouts,
      approved: approvedNightouts,
      rejected: rejectedNightouts,
      out:      await NightOut.countDocuments({ status: 'out' }),
      returned: await NightOut.countDocuments({ status: 'returned' }),
    };

    // ── Top 5 destinations (for bar chart) ──────────────────────
    const topDestinations = await NightOut.aggregate([
      { $group: { _id: '$destination', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
      { $limit: 5 }
    ]);

    // ── Students by course (for bar chart) ──────────────────────
    const studentsByCourse = await Student.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort:  { count: -1 } }
    ]);

    // ── Recent 5 pending requests ────────────────────────────────
    const recentRequests = await NightOut.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        studentsOut,
        pendingNightouts,
        approvedNightouts,
        rejectedNightouts,
        lateReturns,
        totalNightouts,
      },
      charts: {
        last7Days,
        statusBreakdown,
        topDestinations,
        studentsByCourse,
      },
      recentRequests
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
