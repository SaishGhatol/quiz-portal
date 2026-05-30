const mongoose = require('mongoose');

// Generate a random 6-char alphanumeric join code
const makeCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const batchSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  subject:      { type: String, default: '' },
  academicYear: { type: String, default: '' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // 6-char code students use to join this batch
  joinCode:     { type: String, unique: true, default: makeCode },
  isActive:     { type: Boolean, default: true },
  // Visual colour tag for the UI
  color:        { type: String, default: '#2563EB' }
}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);
