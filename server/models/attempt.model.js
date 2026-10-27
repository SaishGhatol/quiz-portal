const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  user: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  maxScore: {
    type: Number,
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    selectedAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    pointsEarned: Number
  }],
  // Proctoring record for this attempt
  proctored: {
    type: Boolean,
    default: false
  },
  violations: [{
    type: {
      type: String,
      enum: ['tab_switch', 'window_blur', 'fullscreen_exit', 'copy', 'paste', 'cut', 'context_menu', 'devtools_shortcut', 'print_shortcut'],
      required: true
    },
    at: { type: Date, default: Date.now },
    detail: String
  }],
  violationCount: {
    type: Number,
    default: 0
  },
  // True when the violation limit forced the submission
  autoSubmitted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Attempt = mongoose.model('Attempt', attemptSchema);
module.exports = Attempt;