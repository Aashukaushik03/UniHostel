const mongoose = require('mongoose');

const MessFeedbackSchema = new mongoose.Schema({

  student:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },

  // Which meal they are rating
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'snacks', 'dinner'],
    required: true
  },

  // Date of the meal
  date: { type: Date, required: true },

  // Rating out of 5
  rating: { type: Number, min: 1, max: 5, required: true },

  // Comment
  comment: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now }

});

// One feedback per student per meal per day
MessFeedbackSchema.index({ student: 1, mealType: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MessFeedback', MessFeedbackSchema);
