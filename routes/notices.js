const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const { protect, adminOnly } = require('../middleware/auth');

// @route GET /api/notices
router.get('/', protect, async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, notices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/notices
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, content, type } = req.body;
    const notice = await Notice.create({ 
      title, 
      content, 
      type, 
      postedBy: req.user._id, 
      postedByName: req.user.name 
    });
    res.status(201).json({ success: true, message: 'Notice posted', notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route DELETE /api/notices/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;