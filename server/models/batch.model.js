const mongoose = require('mongoose');
const crypto   = require('crypto');

// Random 8-char join code without look-alike characters (no 0/O, 1/I)
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode = () => Array.from({ length: 8 }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');

const batchSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  subject:      { type: String, default: '' },
  academicYear: { type: String, default: '' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Code students could use to join this batch
  joinCode:     { type: String, unique: true, default: makeCode },
  isActive:     { type: Boolean, default: true },
  // Visual colour tag for the UI
  color:        { type: String, default: '#2563EB' }
}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);
