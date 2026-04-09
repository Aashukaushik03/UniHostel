const express  = require('express');
const router   = express.Router();
const Room     = require('../models/Room');
const Student  = require('../models/Student');
const { protect, adminOnly } = require('../middleware/auth');

// ── GET room stats summary ────────────────────────────────────
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const total       = await Room.countDocuments();
    const available   = await Room.countDocuments({ status: 'available' });
    const full        = await Room.countDocuments({ status: 'full' });
    const maintenance = await Room.countDocuments({ status: 'maintenance' });
    const allRooms    = await Room.find();
    const totalBeds   = allRooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupied    = allRooms.reduce((sum, r) => sum + r.occupants.length, 0);
    res.json({ success: true, stats: { total, available, full, maintenance, totalBeds, occupied, vacant: totalBeds - occupied } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET unassigned students (for assign dropdown) ─────────────
// ⚠️ MUST be before /:id routes
router.get('/unassigned-students', protect, adminOnly, async (req, res) => {
  try {
    const students = await Student.find({ role: 'student' }).select('name rollNumber course year roomNumber');
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET all rooms with occupant details ──────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('occupants', 'name rollNumber course year phone')
      .sort({ roomNumber: 1 });
    res.json({ success: true, rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── CREATE a new room ─────────────────────────────────────────
router.post('/create', protect, adminOnly, async (req, res) => {
  try {
    const { roomNumber, floor, type, capacity, amenities } = req.body;
    const existing = await Room.findOne({ roomNumber });
    if (existing) {
      return res.status(400).json({ success: false, message: `Room ${roomNumber} already exists.` });
    }
    const capacityMap = { single: 1, double: 2, triple: 3 };
    const room = await Room.create({
      roomNumber,
      floor,
      type,
      capacity: capacity || capacityMap[type] || 2,
      amenities: amenities ? amenities.split(',').map(a => a.trim()) : []
    });
    res.status(201).json({ success: true, message: `Room ${roomNumber} created.`, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ASSIGN student to room ────────────────────────────────────
router.put('/:id/assign', protect, adminOnly, async (req, res) => {
  try {
    const { studentId } = req.body;
    const room    = await Room.findById(req.params.id);
    const student = await Student.findById(studentId);

    if (!room)    return res.status(404).json({ success: false, message: 'Room not found.' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    if (room.status === 'maintenance') {
      return res.status(400).json({ success: false, message: 'Room is under maintenance.' });
    }
    if (room.occupants.length >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Room is already full.' });
    }
    if (room.occupants.map(id => id.toString()).includes(studentId)) {
      return res.status(400).json({ success: false, message: 'Student is already in this room.' });
    }

    // Remove student from any previous room
    await Room.updateMany({ occupants: studentId }, { $pull: { occupants: studentId } });

    // Add to new room
    room.occupants.push(studentId);
    await room.save();

    // Update student's roomNumber field
    student.roomNumber = room.roomNumber;
    await student.save();

    const updated = await Room.findById(req.params.id)
      .populate('occupants', 'name rollNumber course year phone');
    res.json({ success: true, message: `${student.name} assigned to Room ${room.roomNumber}.`, room: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── REMOVE student from room ──────────────────────────────────
router.put('/:id/remove', protect, adminOnly, async (req, res) => {
  try {
    const { studentId } = req.body;
    const room    = await Room.findById(req.params.id);
    const student = await Student.findById(studentId);

    if (!room)    return res.status(404).json({ success: false, message: 'Room not found.' });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    room.occupants = room.occupants.filter(id => id.toString() !== studentId);
    await room.save();

    student.roomNumber = 'Unassigned';
    await student.save();

    const updated = await Room.findById(req.params.id)
      .populate('occupants', 'name rollNumber course year phone');
    res.json({ success: true, message: `${student.name} removed from Room ${room.roomNumber}.`, room: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── UPDATE room status (maintenance toggle) ───────────────────
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    room.status = status;
    await room.save();
    res.json({ success: true, message: `Room ${room.roomNumber} marked as ${status}.`, room });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE room (only if empty) ───────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });
    if (room.occupants.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete a room with occupants. Remove students first.' });
    }
    await Room.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Room ${room.roomNumber} deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;