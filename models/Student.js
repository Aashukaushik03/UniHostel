const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  roomNumber: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  course: { type: String, required: true },
  year: { type: String, required: true },
  parentName: { type: String, required: true },
  parentPhone: { type: String, required: true },
  parentEmail: { type: String },
  photo: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['student', 'admin', 'warden'], 
    default: 'student' 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active' 
  },
  currentlyOut: { type: Boolean, default: false },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', StudentSchema);