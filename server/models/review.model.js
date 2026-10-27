const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name:   { type: String, required: true, trim: true },
  role:   { type: String, required: true, trim: true, maxlength: 80 },
  quote:  { type: String, required: true, trim: true, maxlength: 600 },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  // New reviews wait for an admin before they appear on the home page
  approved: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
