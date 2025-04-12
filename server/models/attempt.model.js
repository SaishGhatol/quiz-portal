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
  }]
}, { timestamps: true });

const Attempt = mongoose.model('Attempt', attemptSchema);
module.exports = Attempt;