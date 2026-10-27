const mongoose = require('mongoose');

const QUESTION_TYPES = ['multiple', 'single', 'truefalse', 'text'];
const CHOICE_TYPES   = ['multiple', 'single', 'truefalse'];

/** Returns why a set of options can't be graded for this question type, or null when it's fine */
const optionsProblem = (type, opts = []) => {
  const correct = opts.filter(o => o && o.isCorrect === true).length;
  if (CHOICE_TYPES.includes(type)) {
    if (opts.length < 2 || opts.length > 10) return 'A question needs between 2 and 10 options';
    if (type === 'truefalse' && opts.length !== 2) return 'A true/false question needs exactly 2 options';
    if (correct === 0) return 'Mark at least one option as correct';
    if (type !== 'multiple' && correct > 1) return 'A single-answer question can have only one correct option';
  } else if (type === 'text') {
    if (opts.length < 1 || opts.length > 10) return 'A text question needs between 1 and 10 accepted answers';
    if (correct === 0) return 'Mark at least one accepted answer as correct';
  }
  return null;
};

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    trim: true,
    required: [true, 'Every option needs text'],
    maxlength: [500, 'Option text must be 500 characters or fewer']
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
});

const questionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  text: {
    type: String,
    trim: true,
    required: [true, 'Question text is required'],
    maxlength: [2000, 'Question text must be 2000 characters or fewer']
  },
  options: {
    type: [optionSchema],
    // A path validator (not a pre-validate hook) so validateSync() in bulk import checks it too
    validate: {
      validator: function (opts) {
        const problem = optionsProblem(this.type, opts);
        if (problem) throw new Error(problem); // surfaced through props.reason below
        return true;
      },
      message: props => props.reason?.message || 'Invalid options'
    }
  },
  type: {
    type: String,
    enum: { values: QUESTION_TYPES, message: 'Question type must be one of: ' + QUESTION_TYPES.join(', ') },
    default: 'single',
    required: true
  },
  points: {
    type: Number,
    default: 1,
    min: [0, 'Points must be between 0 and 100'],
    max: [100, 'Points must be between 0 and 100']
  },
  explanation: {
    type: String,
    maxlength: [2000, 'Explanation must be 2000 characters or fewer']
  },
  // Position within the quiz; reads sort by { order: 1, createdAt: 1 }
  order: {
    type: Number
  }
}, { timestamps: true });

questionSchema.index({ quizId: 1, order: 1, createdAt: 1 });

const Question = mongoose.model('Question', questionSchema);
Question.QUESTION_TYPES = QUESTION_TYPES;
module.exports = Question;
