const mongoose = require('mongoose');

const NightOutSchema = new mongoose.Schema({

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },

  studentName: {
    type: String,
    required: true
  },

  rollNumber: {
    type: String,
    required: true
  },

  roomNumber: {
    type: String,
    required: true
  },

  reason: {
    type: String,
    required: true
  },

  destination: {
    type: String,
    required: true
  },

  outDate: {
    type: Date,
    required: true
  },

  returnDate: {
    type: Date,
    required: true
  },

  outTime: {
    type: String,
    required: true
  },

  returnTime: {
    type: String,
    required: true
  },

  // Proof type (optional for weekends)
  proofType: {
    type: String,
    enum: [
      'office_letter',
      'internship_letter',
      'medical_certificate',
      'event_pass',
      'parent_consent',
      'other'
    ],
    default: 'other'
  },

  // Proof file path (optional)
  proofDocument: {
    type: String,
    default: null
  },

  additionalNotes: {
    type: String,
    default: ''
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired', 'out', 'returned'], // ✅ added 'out' and 'returned'
    default: 'pending'
  },

  adminRemarks: {
    type: String,
    default: ''
  },

  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },

  reviewedAt: {
    type: Date
  },

  isLateReturn: {
    type: Boolean,
    default: false
  },

  actualReturnTime: {
    type: Date
  },

  // ✅ NEW: stores the QR code as base64 image, generated on approval
  qrCode: {
    type: String,
    default: null
  },

  // ✅ NEW: actual gate timestamps (different from requested outDate/returnDate)
  outTimeActual: {
    type: Date
  },

  returnTimeActual: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.models.NightOut || mongoose.model("NightOut", NightOutSchema);