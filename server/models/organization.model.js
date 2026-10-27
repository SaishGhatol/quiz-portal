const mongoose = require('mongoose');
const crypto   = require('crypto');

// Invite codes avoid look-alike characters (no 0/O, 1/I) so they're easy to read out and type
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeInviteCode = (len = 8) =>
  Array.from({ length: len }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');

const orgSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  type:         { type: String, enum: ['tuition', 'school', 'college', 'corporate', 'university', 'other'], default: 'tuition' },
  description:  { type: String, default: '' },
  logo:         { type: String, default: '' },
  contactEmail: { type: String, required: true, lowercase: true, trim: true },
  phone:        { type: String, default: '' },
  website:      { type: String, default: '' },
  address:      { type: String, default: '' },

  // 8-char code students use to join (older orgs may still have 6-char codes)
  inviteCode: {
    type: String,
    unique: true,
    default: () => makeInviteCode()
  },

  plan:        { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
  planExpiry:  { type: Date, default: null },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminUsers:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive:    { type: Boolean, default: true },

  // Informational snapshot only — limits are always enforced from config/plans.js by `plan`
  limits: {
    maxStudents: { type: Number, default: 25 },
    maxBatches:  { type: Number, default: 3 },
    maxQuizzes:  { type: Number, default: 10 }
  },
  settings: {
    allowSelfEnroll: { type: Boolean, default: true },
    showLeaderboard: { type: Boolean, default: true },
    brandColor:      { type: String,  default: '#4f46e5' }
  }
}, { timestamps: true });

orgSchema.statics.makeInviteCode = makeInviteCode;

module.exports = mongoose.model('Organization', orgSchema);
