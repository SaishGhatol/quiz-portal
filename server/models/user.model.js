const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false   // never returned unless a query explicitly asks for '+password'
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'org_admin', 'teacher'],
    default: 'user'
  },
  // Organization membership (ObjectId reference)
  orgId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
  batchIds:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],

  profilePicture: { type: String, default: '' },
  lastLoginAt:    { type: Date, default: null },
  // Deactivated users can't sign in and their existing tokens stop working
  isActive:       { type: Boolean, default: true },
  // Tokens issued before this moment are rejected (set when the password changes)
  passwordChangedAt: { type: Date, default: null },
  // Quizzes bookmarked for later
  savedQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
  // Mistake-notebook questions answered correctly in practice since they were last missed
  clearedMistakes: [{
    _id: false,
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    at: { type: Date, default: Date.now },
  }]
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;