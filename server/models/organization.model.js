const mongoose = require('mongoose');
const crypto   = require('crypto');

const orgSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  type:         { type: String, enum: ['tuition', 'school', 'college', 'corporate', 'university', 'other'], default: 'tuition' },
  description:  { type: String, default: '' },
  logo:         { type: String, default: '' },
  contactEmail: { type: String, required: true, lowercase: true, trim: true },
  phone:        { type: String, default: '' },
  website:      { type: String, default: '' },
  address:      { type: String, default: '' },

  // 6-char alphanumeric code students use to join
  inviteCode: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(3).toString('hex').toUpperCase()
  },

  plan:        { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
  planExpiry:  { type: Date, default: null },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminUsers:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive:    { type: Boolean, default: true },

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

module.exports = mongoose.model('Organization', orgSchema);
