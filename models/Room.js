const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true, trim: true },
  floor:      { type: String, required: true },
  type:       { type: String, enum: ['single', 'double', 'triple'], default: 'double' },
  capacity:   { type: Number, required: true, default: 2 },
  occupants:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  amenities:  [{ type: String }],
  status:     { type: String, enum: ['available', 'full', 'maintenance'], default: 'available' },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', RoomSchema);