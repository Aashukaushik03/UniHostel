const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['general', 'urgent', 'safety', 'event', 'maintenance'], 
    default: 'general' 
  },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  postedByName: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notice', NoticeSchema);