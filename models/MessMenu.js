const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  breakfast: { type: String, default: '' },
  lunch:     { type: String, default: '' },
  snacks:    { type: String, default: '' },
  dinner:    { type: String, default: '' },
});

const MessMenuSchema = new mongoose.Schema({

  // Week start date (always Monday)
  weekStart: { type: Date, required: true, unique: true },

  monday:    { type: MealSchema, default: {} },
  tuesday:   { type: MealSchema, default: {} },
  wednesday: { type: MealSchema, default: {} },
  thursday:  { type: MealSchema, default: {} },
  friday:    { type: MealSchema, default: {} },
  saturday:  { type: MealSchema, default: {} },
  sunday:    { type: MealSchema, default: {} },

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MessMenu', MessMenuSchema);
