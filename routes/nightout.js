const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const NightOut = require('../models/NightOut');
const Student = require('../models/Student');
const { protect, adminOnly } = require('../middleware/auth');
const { sendApprovalEmail, sendRejectionEmail } = require('../emailService');
const { generateGatePassQR } = require('../services/qrService');  // ✅ NEW: add this line

// Multer config for file uploads  (UNCHANGED)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/proofs');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `proof_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype =
    allowedTypes.test(file.mimetype) ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (extname && mimetype) return cb(null, true);
  cb(new Error('Only images (JPG/PNG), PDF, and Word documents are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});


// ===============================
// APPLY NIGHT OUT  (UNCHANGED)
// ===============================
router.post('/apply', protect, upload.single('proofDocument'), async (req, res) => {
  try {
    const { reason, destination, outDate, returnDate, outTime, returnTime, proofType, additionalNotes } = req.body;

    const parts = outDate.split("-");
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const day = date.getDay();
    const isWeekend = (day === 0 || day === 6);

    if (!isWeekend && !req.file) {
      return res.status(400).json({ success: false, message: 'Proof document is required for weekday night-out.' });
    }

    const proofPath = req.file ? `/uploads/proofs/${req.file.filename}` : null;

    const nightout = await NightOut.create({
      student: req.user._id,
      studentName: req.user.name,
      rollNumber: req.user.rollNumber,
      roomNumber: req.user.roomNumber,
      reason, destination, outDate, returnDate, outTime, returnTime,
      proofType: req.file ? proofType : 'other',
      proofDocument: proofPath,
      additionalNotes
    });

    res.status(201).json({
      success: true,
      message: isWeekend
        ? 'Weekend night-out request submitted (proof not required).'
        : 'Night-out request submitted successfully. Awaiting admin approval.',
      nightout
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ===============================
// STUDENT REQUEST HISTORY  (UNCHANGED)
// ===============================
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await NightOut.find({ student: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ===============================
// GET QR CODE  ✅ NEW ROUTE
// ===============================
// @route GET /api/nightout/:id/qr
router.get('/:id/qr', protect, async (req, res) => {
  try {
    const nightout = await NightOut.findById(req.params.id);

    if (!nightout) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only the owner or admin can view
    if (nightout.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (nightout.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'QR code is only available for approved requests' });
    }

    if (!nightout.qrCode) {
      return res.status(404).json({ success: false, message: 'QR code not generated yet' });
    }

    res.json({
      success:     true,
      qrCode:      nightout.qrCode,
      studentName: nightout.studentName,
      rollNumber:  nightout.rollNumber,
      roomNumber:  nightout.roomNumber,
      destination: nightout.destination,
      outDate:     nightout.outDate,
      returnDate:  nightout.returnDate,
      outTime:     nightout.outTime,
      returnTime:  nightout.returnTime,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ===============================
// ADMIN VIEW ALL REQUESTS  (UNCHANGED)
// ===============================
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = status ? { status } : {};
    const requests = await NightOut.find(query).sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const total = await NightOut.countDocuments(query);
    res.json({ success: true, count: requests.length, total, pages: Math.ceil(total / limit), requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ===============================
// ADMIN APPROVE / REJECT  ✅ QR ADDED HERE
// ===============================
router.put('/:id/review', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const nightout = await NightOut.findByIdAndUpdate(
      req.params.id,
      { status, adminRemarks, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );

    if (!nightout) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // ✅ NEW: Generate QR code when admin approves
    if (status === 'approved') {
      const qrCode = await generateGatePassQR(nightout);
      if (qrCode) {
        nightout.qrCode = qrCode;
        await nightout.save();
        console.log(`✅ Gate pass QR generated for ${nightout.studentName}`);
      }
    }

    // Send email to parent  (UNCHANGED)
    const student = await Student.findById(nightout.student);
    if (student && student.parentEmail) {
      const details = {
        destination: nightout.destination,
        reason:      nightout.reason,
        outDate:     new Date(nightout.outDate).toLocaleDateString('en-IN'),
        returnDate:  new Date(nightout.returnDate).toLocaleDateString('en-IN'),
        outTime:     nightout.outTime,
        returnTime:  nightout.returnTime,
        roomNumber:  nightout.roomNumber
      };

      if (status === 'approved') {
        await sendApprovalEmail(student.parentEmail, student.parentName, student.name, details);
      } else {
        await sendRejectionEmail(student.parentEmail, student.parentName, student.name, details, adminRemarks);
      }
    }

    res.json({
      success: true,
      message: `Request ${status} successfully.${status === 'approved' ? ' QR gate pass generated.' : ''} Parent notified via email.`,
      nightout,
      qrCode: status === 'approved' ? nightout.qrCode : null,  // ✅ NEW: return QR in response
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ===============================
// ADMIN STATS  (UNCHANGED)
// ===============================
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const total    = await NightOut.countDocuments();
    const pending  = await NightOut.countDocuments({ status: 'pending' });
    const approved = await NightOut.countDocuments({ status: 'approved' });
    const rejected = await NightOut.countDocuments({ status: 'rejected' });
    res.json({ success: true, stats: { total, pending, approved, rejected } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;