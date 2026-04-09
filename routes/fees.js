const express  = require('express');
const router   = express.Router();
const Fee      = require('../models/Fee');
const Student  = require('../models/Student');
const { protect, adminOnly } = require('../middleware/auth');

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ✅ STEP 1 — /stats FIRST (before /:id routes)
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const currentMonth = MONTHS[new Date().getMonth()];
    const currentYear  = new Date().getFullYear();
    const thisMonth = await Fee.find({ month: currentMonth, year: currentYear });
    const paid    = thisMonth.filter(f => f.status === 'paid').length;
    const unpaid  = thisMonth.filter(f => f.status === 'unpaid').length;
    const overdue = thisMonth.filter(f => f.status === 'overdue').length;
    const total   = thisMonth.length;
    const paidAmt = thisMonth.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    res.json({ success: true, currentMonth, currentYear, stats: { total, paid, unpaid, overdue, paidAmt } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ STEP 2 — /my-fees SECOND (before /:id routes)
router.get('/my-fees', protect, async (req, res) => {
  try {
    const fees = await Fee.find({ student: req.user._id }).sort({ year: -1, month: 1 });
    const totalDue  = fees.filter(f => f.status !== 'paid' && f.status !== 'waived').reduce((s, f) => s + f.amount, 0);
    const totalPaid = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    res.json({ success: true, fees, totalDue, totalPaid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ STEP 3 — /generate
router.post('/generate', protect, adminOnly, async (req, res) => {
  try {
    const { month, year, amount = 5000 } = req.body;
    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }
    const students = await Student.find({ role: 'student', status: 'active' });
    if (!students.length) {
      return res.status(400).json({ success: false, message: 'No active students found' });
    }
    let created = 0, skipped = 0;
    for (const student of students) {
      try {
        await Fee.create({
          student: student._id, studentName: student.name,
          rollNumber: student.rollNumber, roomNumber: student.roomNumber,
          month, year: Number(year), amount: Number(amount), status: 'unpaid'
        });
        created++;
      } catch (err) {
        if (err.code === 11000) { skipped++; } else throw err;
      }
    }
    res.status(201).json({ success: true, message: `Fee records generated: ${created} created, ${skipped} already existed.`, created, skipped });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ STEP 4 — / (get all fees)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { month, year, status } = req.query;
    const query = {};
    if (month)  query.month  = month;
    if (year)   query.year   = Number(year);
    if (status) query.status = status;
    const fees     = await Fee.find(query).sort({ roomNumber: 1, studentName: 1 });
    const total    = fees.length;
    const paid     = fees.filter(f => f.status === 'paid').length;
    const unpaid   = fees.filter(f => f.status === 'unpaid').length;
    const overdue  = fees.filter(f => f.status === 'overdue').length;
    const totalAmt = fees.reduce((sum, f) => sum + f.amount, 0);
    const paidAmt  = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
    res.json({ success: true, summary: { total, paid, unpaid, overdue, totalAmt, paidAmt, pendingAmt: totalAmt - paidAmt }, fees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ STEP 5 — /:id routes LAST
router.put('/:id/pay', protect, adminOnly, async (req, res) => {
  try {
    const { paymentMode = 'cash', transactionId = '', remarks = '' } = req.body;
    const fee = await Fee.findByIdAndUpdate(req.params.id,
      { status: 'paid', paidOn: new Date(), paymentMode, transactionId, remarks, markedBy: req.user._id },
      { new: true }
    );
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
    res.json({ success: true, message: `Fee marked as paid for ${fee.studentName}`, fee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/overdue', protect, adminOnly, async (req, res) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id,
      { status: 'overdue', remarks: req.body.remarks || '' },
      { new: true }
    );
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
    res.json({ success: true, message: `Fee marked as overdue for ${fee.studentName}`, fee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
