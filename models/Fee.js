const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },

  studentName: { type: String, required: true },
  rollNumber:  { type: String, required: true },
  roomNumber:  { type: String, required: true },

  // e.g. "January 2025"
  month: { type: String, required: true },

  // e.g. 2025
  year: { type: Number, required: true },

  // Fee amount in INR
  amount: { type: Number, required: true, default: 5000 },

  status: {
    type: String,
    enum: ['unpaid', 'paid', 'overdue', 'waived'],
    default: 'unpaid'
  },

  // Date admin marked it paid
  paidOn: { type: Date, default: null },

  // How payment was made
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'other'],
    default: 'cash'
  },

  // Receipt or transaction ID
  transactionId: { type: String, default: '' },

  // Any notes from admin
  remarks: { type: String, default: '' },

  // Admin who marked it paid
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },

  createdAt: { type: Date, default: Date.now }

});

// Prevent duplicate fee entry for same student + same month + year
FeeSchema.index({ student: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Fee', FeeSchema);
