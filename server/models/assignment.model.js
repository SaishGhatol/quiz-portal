const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  quiz:         { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz',         required: true },
  batch:        { type: mongoose.Schema.Types.ObjectId, ref: 'Batch',        required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  assignedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',         required: true },
  title:        { type: String, default: '' },       // optional display override
  instructions: { type: String, default: '' },
  startDate:    { type: Date,   default: Date.now },
  dueDate:      { type: Date,   default: null },
  maxAttempts:  { type: Number, default: 1, min: 1, max: 10 },
  passingScore: { type: Number, default: null },      // % override; null → use quiz's passScore
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });

// Prevent duplicate assignments of the same quiz to the same batch
assignmentSchema.index({ quiz: 1, batch: 1 }, { unique: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
