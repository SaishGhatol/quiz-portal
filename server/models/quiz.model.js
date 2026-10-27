const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title must be 200 characters or fewer']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description must be 2000 characters or fewer']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category must be 100 characters or fewer']
  },
  difficulty: {
    type: String,
    enum: { values: ['easy', 'medium', 'hard'], message: 'Difficulty must be easy, medium or hard' },
    required: [true, 'Difficulty is required']
  },
  // Minutes; 0 means no time limit (the quiz pages treat 0 as "None")
  timeLimit: {
    type: Number,
    required: [true, 'Time limit is required'],
    min: [0, 'Time limit must be between 0 and 300 minutes'],
    max: [300, 'Time limit must be between 0 and 300 minutes']
  },
  // Percentage of the maximum score needed to pass
  passScore: {
    type: Number,
    required: [true, 'Pass score is required'],
    min: [0, 'Pass score must be between 0 and 100'],
    max: [100, 'Pass score must be between 0 and 100']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Which organisation this quiz belongs to (null = platform-wide quiz created by a platform admin)
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  totalAttempts: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  // Scheduling: optional window during which quiz is accessible
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  tags: {
    type: [{ type: String, trim: true, maxlength: [50, 'Each tag must be 50 characters or fewer'] }],
    default: [],
    validate: { validator: v => !v || v.length <= 20, message: 'A quiz can have at most 20 tags' }
  },
  // Proctoring: anti-cheat rules enforced while the quiz is being taken
  proctoring: {
    enabled:           { type: Boolean, default: false },
    requireFullscreen: { type: Boolean, default: true },
    blockTabSwitch:    { type: Boolean, default: true },
    blockCopyPaste:    { type: Boolean, default: true },
    blockContextMenu:  { type: Boolean, default: true },
    // 0 means warn every time but never auto-submit
    maxViolations:     { type: Number,  default: 3, min: [0, 'Max violations must be between 0 and 20'], max: [20, 'Max violations must be between 0 and 20'] }
  }
}, { timestamps: true });

quizSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    this.invalidate('endDate', 'End date must be after the start date');
  }
  next();
});

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;