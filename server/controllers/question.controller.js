const mongoose = require('mongoose');
const Question = require('../models/question.model');
const Quiz = require('../models/quiz.model');
const { canManageQuiz, canAccessQuiz } = require('../utils/quizAccess');

const MAX_BULK_QUESTIONS = 200;
const QUESTION_SORT = { order: 1, createdAt: 1 };

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Mongoose ValidationError → { message, errors[] } with readable messages */
const validationDetails = err => {
  const errors = Object.values(err.errors || {}).map(e => e.message);
  return { message: errors[0] || 'Invalid question', errors };
};

const sendValidationError = (res, err) => res.status(400).json(validationDetails(err));

/** Position for a question appended to the end of a quiz */
const nextQuestionOrder = async quizId => {
  const [last, count] = await Promise.all([
    Question.findOne({ quizId, order: { $ne: null } }).sort({ order: -1 }).select('order').lean(),
    Question.countDocuments({ quizId })
  ]);
  // Older questions may have no order (they sort first), so never go below the count
  return Math.max(last?.order ?? -1, count - 1) + 1;
};

/**
 * Picks only the writable question fields from a request body.
 * Returns { error } when a field has the wrong shape, otherwise { data }.
 */
const pickQuestionFields = (body, { partial = false } = {}) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Each question must be an object' };
  const data = {};

  if (body.text !== undefined) {
    if (typeof body.text !== 'string') return { error: 'Question text must be a string' };
    data.text = body.text;
  } else if (!partial) {
    return { error: 'Question text is required' };
  }

  if (body.options !== undefined) {
    if (!Array.isArray(body.options)) return { error: 'Options must be an array' };
    if (body.options.some(o => !o || typeof o !== 'object' || typeof o.text !== 'string')) {
      return { error: 'Each option must be an object with text' };
    }
    data.options = body.options.map(o => ({ text: o.text, isCorrect: o.isCorrect === true }));
  } else if (!partial) {
    return { error: 'Options are required' };
  }

  if (body.type !== undefined && body.type !== null && body.type !== '') data.type = body.type;
  else if (!partial) data.type = 'single';

  if (body.points !== undefined && body.points !== null && body.points !== '') {
    const points = Number(body.points);
    if (!Number.isFinite(points)) return { error: 'Points must be a number' };
    data.points = points;
  }

  if (body.explanation !== undefined) {
    if (body.explanation !== null && typeof body.explanation !== 'string') return { error: 'Explanation must be a string' };
    data.explanation = body.explanation || '';
  }

  return { data };
};

/** Removes answer keys so the question can be shown to someone taking the quiz */
const stripAnswers = q => {
  const obj = typeof q.toObject === 'function' ? q.toObject() : { ...q };
  obj.options = (obj.options || []).map(({ isCorrect, ...rest }) => rest);
  delete obj.explanation;
  return obj;
};

/** Loads the quiz behind a write and checks the caller may manage it; sends the error response itself */
const loadManagedQuiz = async (req, res, quizId, action = 'manage questions for') => {
  if (!quizId || !mongoose.Types.ObjectId.isValid(String(quizId))) {
    res.status(400).json({ message: 'A valid quizId is required' });
    return null;
  }
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    res.status(404).json({ message: 'Quiz not found' });
    return null;
  }
  if (!(await canManageQuiz(req, quiz))) {
    res.status(403).json({ message: `Not authorized to ${action} this quiz` });
    return null;
  }
  return quiz;
};

// ── Handlers ─────────────────────────────────────────────────────────────────

// Create a new question for a quiz
exports.createQuestion = async (req, res, next) => {
  try {
    const quiz = await loadManagedQuiz(req, res, req.body?.quizId, 'add questions to');
    if (!quiz) return;

    const { data, error } = pickQuestionFields(req.body);
    if (error) return res.status(400).json({ message: error });

    const question = new Question({ ...data, quizId: quiz._id, order: await nextQuestionOrder(quiz._id) });
    const savedQuestion = await question.save();

    // Update quiz's totalQuestions count
    await Quiz.findByIdAndUpdate(quiz._id, { $inc: { totalQuestions: 1 } });

    res.status(201).json(savedQuestion);
  } catch (error) {
    if (error.name === 'ValidationError') return sendValidationError(res, error);
    console.error('Error in createQuestion:', error);
    next(error);
  }
};

// Get all questions for a quiz.
// Answer keys (isCorrect, explanation) are only included for people who manage the quiz
// AND ask for them with ?withAnswers=true; everyone else gets them stripped.
exports.getQuestionsByQuiz = async (req, res, next) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const canManage = await canManageQuiz(req, quiz);
    if (!canManage && !(await canAccessQuiz(req, quiz))) {
      return res.status(403).json({ message: 'You do not have access to this quiz' });
    }

    const withAnswers = canManage && req.query.withAnswers === 'true';
    const questions = await Question.find({ quizId }).sort(QUESTION_SORT);

    res.json({
      questions: withAnswers ? questions : questions.map(stripAnswers),
      withAnswers
    });
  } catch (error) {
    console.error('Get questions by quiz error:', error);
    next(error);
  }
};

// Get a single question (answers only for people who manage its quiz)
exports.getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const quiz = await Quiz.findById(question.quizId);
    if (!quiz) return res.status(404).json({ message: 'Question not found' });

    if (await canManageQuiz(req, quiz)) return res.json({ question });
    if (await canAccessQuiz(req, quiz)) return res.json({ question: stripAnswers(question) });
    return res.status(403).json({ message: 'You do not have access to this question' });
  } catch (error) {
    console.error('Get question error:', error);
    next(error);
  }
};

// Update a question
exports.updateQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const quiz = await loadManagedQuiz(req, res, question.quizId, 'update questions in');
    if (!quiz) return;

    const { data, error } = pickQuestionFields(req.body, { partial: true });
    if (error) return res.status(400).json({ message: error });

    if (data.text !== undefined) question.text = data.text;
    if (data.options !== undefined) question.options = data.options;
    if (data.type !== undefined) {
      question.type = data.type;
      // Re-check the options against the new type even when they weren't sent
      question.markModified('options');
    }
    if (data.points !== undefined) question.points = data.points;
    if (data.explanation !== undefined) question.explanation = data.explanation;

    const updatedQuestion = await question.save();

    res.json({
      message: 'Question updated successfully',
      question: updatedQuestion
    });
  } catch (error) {
    if (error.name === 'ValidationError') return sendValidationError(res, error);
    console.error('Update question error:', error);
    next(error);
  }
};

// Delete a question
exports.deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const quiz = await loadManagedQuiz(req, res, question.quizId, 'delete questions from');
    if (!quiz) return;

    // A published quiz with no questions can't be taken — make the admin unpublish it first
    if (quiz.isPublished && (await Question.countDocuments({ quizId: quiz._id })) <= 1) {
      return res.status(400).json({ message: 'This is the last question of a published quiz. Unpublish the quiz before deleting it.' });
    }

    const deleted = await Question.findOneAndDelete({ _id: question._id });
    if (deleted) {
      await Quiz.findByIdAndUpdate(quiz._id, { $inc: { totalQuestions: -1 } });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    next(error);
  }
};

// Bulk create questions: all rows are validated first; nothing is saved unless every row is valid
exports.bulkCreateQuestions = async (req, res, next) => {
  try {
    const { quizId, questions } = req.body || {};

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'questions must be a non-empty array' });
    }
    if (questions.length > MAX_BULK_QUESTIONS) {
      return res.status(400).json({ message: `You can import at most ${MAX_BULK_QUESTIONS} questions at a time` });
    }

    const quiz = await loadManagedQuiz(req, res, quizId, 'add questions to');
    if (!quiz) return;

    const startOrder = await nextQuestionOrder(quiz._id);
    const docs = [];
    const errors = [];

    questions.forEach((raw, index) => {
      const { data, error } = pickQuestionFields(raw);
      if (error) {
        errors.push({ index, row: index + 1, messages: [error] });
        return;
      }
      const doc = new Question({ ...data, quizId: quiz._id, order: startOrder + index });
      const invalid = doc.validateSync();
      if (invalid) {
        errors.push({ index, row: index + 1, messages: validationDetails(invalid).errors });
        return;
      }
      docs.push(doc);
    });

    if (errors.length) {
      const first = errors[0];
      return res.status(400).json({
        message: `${errors.length} of ${questions.length} question${questions.length === 1 ? ' is' : 's are'} invalid — nothing was imported. Row ${first.row}: ${first.messages[0]}`,
        errors
      });
    }

    const insertedQuestions = await Question.insertMany(docs);

    await Quiz.findByIdAndUpdate(quiz._id, {
      $inc: { totalQuestions: insertedQuestions.length }
    });

    res.status(201).json({
      message: `${insertedQuestions.length} questions created successfully`,
      questions: insertedQuestions
    });
  } catch (error) {
    if (error.name === 'ValidationError') return sendValidationError(res, error);
    console.error('Bulk create questions error:', error);
    next(error);
  }
};

// Move a question one place up or down
exports.reorderQuestion = async (req, res, next) => {
  try {
    const { questionId } = req.params;
    const { direction } = req.body || {};

    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({ message: 'Invalid direction. Use "up" or "down"' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const quiz = await loadManagedQuiz(req, res, question.quizId, 'reorder questions in');
    if (!quiz) return;

    const all = await Question.find({ quizId: quiz._id }).sort(QUESTION_SORT).select('_id');
    const idx = all.findIndex(q => String(q._id) === String(question._id));
    const target = direction === 'up' ? idx - 1 : idx + 1;

    if (target < 0 || target >= all.length) {
      return res.status(400).json({
        message: `Question cannot be moved ${direction}. It's already at the ${direction === 'up' ? 'top' : 'bottom'}.`
      });
    }

    [all[idx], all[target]] = [all[target], all[idx]];
    await Question.bulkWrite(all.map((q, order) => ({
      updateOne: { filter: { _id: q._id, quizId: quiz._id }, update: { $set: { order } } }
    })));

    res.json({ message: 'Question reordered successfully' });
  } catch (error) {
    console.error('Reorder question error:', error);
    next(error);
  }
};

exports.QUESTION_SORT = QUESTION_SORT;
