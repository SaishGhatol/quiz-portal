const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name:   { type: String, required: true, trim: true },
  role:   { type: String, required: true, trim: true },
  quote:  { type: String, required: true, trim: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  approved: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
