const mongoose = require('mongoose');

const MessOptOutSchema = new mongoose.Schema({

  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  rollNumber:  { type: String, required: true },
  roomNumber:  { type: String, required: true },

  // Date range for opt-out
  fromDate: { type: Date, required: true },
  toDate:   { type: Date, required: true },

  reason: { type: String, required: true },

  // Which meals to skip
  skipBreakfast: { type: Boolean, default: false },
  skipLunch:     { type: Boolean, default: false },
  skipSnacks:    { type: Boolean, default: false },
  skipDinner:    { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  adminRemarks: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now }

});

module.exports = mongoose.model('MessOptOut', MessOptOutSchema);
