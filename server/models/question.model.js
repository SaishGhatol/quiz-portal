const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  type: {
    type: String,
    enum: ['multiple', 'single', 'truefalse', 'text'],
    required: true
  },
  points: {
    type: Number,
    default: 1
  },
  explanation: {
    type: String
  }
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);
module.exports = Question;