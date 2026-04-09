const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  studentName: { type: String, required: true },
  rollNumber:  { type: String, required: true },
  roomNumber:  { type: String, required: true },

  category: {
    type: String,
    enum: ['electrical', 'plumbing', 'furniture', 'cleanliness', 'internet', 'security', 'other'],
    required: true
  },

  title:       { type: String, required: true },
  description: { type: String, required: true },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },

  adminRemarks: { type: String, default: '' },

  resolvedAt: { type: Date },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Complaint', ComplaintSchema);