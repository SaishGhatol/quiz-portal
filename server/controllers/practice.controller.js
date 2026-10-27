// Practice mode, the mistake notebook and saved quizzes.
// Practice never creates attempts, so it can't affect scores, assignments or the leaderboard.
const Quiz = require('../models/quiz.model');
const Question = require('../models/question.model');
const Attempt = require('../models/attempt.model');
const User = require('../models/user.model');
const { canAccessQuiz, visibleQuizFilter } = require('../utils/quizAccess');
const { checkAssignmentRules } = require('../utils/assignmentRules');
const { isObjectId } = require('../middleware/objectId.middleware');

// Answers may be revealed only when that can't help with a live assessment
const practiceGate = async (req, quiz) => {
  if (!quiz || !(await canAccessQuiz(req, quiz))) return { status: 404, message: 'Quiz not found' };
  if (quiz.proctoring?.enabled) return { status: 403, message: 'Proctored quizzes can\'t be practised.' };
  const now = new Date();
  if (quiz.startDate && now < quiz.startDate) return { status: 403, message: 'This quiz is not available yet.' };
  const rules = await checkAssignmentRules(req.userId, quiz);
  if (rules.state === 'open') return { status: 403, message: 'This quiz is part of an open assignment — take it from My assignments instead.' };
  if (rules.state === 'upcoming') return { status: 403, message: 'This quiz is assigned to your batch and hasn\'t opened yet.' };
  return { ok: true };
};

const publicQuestion = q => ({ _id: q._id, text: q.text, type: q.type, options: q.options.map(o => ({ _id: o._id, text: o.text })) });

// GET /api/practice/quizzes/:id — questions for an untimed practice run
exports.getPracticeQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'name');
    const gate = await practiceGate(req, quiz);
    if (!gate.ok) return res.status(gate.status).json({ message: gate.message });
    const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1, createdAt: 1 });
    res.json({
      quiz: { _id: quiz._id, title: quiz.title, category: quiz.category, difficulty: quiz.difficulty, description: quiz.description },
      questions: questions.map(publicQuestion),
    });
  } catch (err) {
    console.error('Practice quiz error:', err);
    res.status(500).json({ message: 'Server error loading practice' });
  }
};

// POST /api/practice/check { questionId, selectedOptionId } — instant feedback for one answer
exports.checkAnswer = async (req, res) => {
  try {
    const { questionId, selectedOptionId } = req.body || {};
    if (!isObjectId(questionId) || !isObjectId(selectedOptionId)) {
      return res.status(400).json({ message: 'questionId and selectedOptionId are required' });
    }
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    const quiz = await Quiz.findById(question.quizId);
    const gate = await practiceGate(req, quiz);
    if (!gate.ok) return res.status(gate.status).json({ message: gate.message });

    const option = question.options.find(o => String(o._id) === String(selectedOptionId));
    if (!option) return res.status(400).json({ message: 'That option doesn\'t belong to this question' });
    const correct = question.options.find(o => o.isCorrect);
    const isCorrect = option.isCorrect === true;

    // A correct practice answer clears the question from the mistake notebook
    if (isCorrect) {
      await User.updateOne({ _id: req.userId }, { $pull: { clearedMistakes: { question: question._id } } });
      await User.updateOne({ _id: req.userId }, { $push: { clearedMistakes: { question: question._id, at: new Date() } } });
    }

    res.json({ isCorrect, correctOptionId: correct?._id || null, explanation: question.explanation || '' });
  } catch (err) {
    console.error('Practice check error:', err);
    res.status(500).json({ message: 'Server error checking answer' });
  }
};

/**
 * GET /api/practice/mistakes — questions whose latest graded answer was wrong and that
 * haven't been answered correctly in practice since. Newest misses first.
 */
exports.getMistakes = async (req, res) => {
  try {
    const attempts = await Attempt.find({ user: req.userId, completedAt: { $ne: null } })
      .select('quiz completedAt answers.questionId answers.isCorrect answers.selectedAnswer')
      .sort({ completedAt: 1 });

    // Walk attempts oldest → newest so the last write per question is its latest answer
    const latest = new Map();
    for (const a of attempts) {
      for (const ans of a.answers) {
        const key = String(ans.questionId);
        const prev = latest.get(key);
        latest.set(key, {
          quizId: a.quiz,
          isCorrect: ans.isCorrect,
          selectedAnswer: ans.selectedAnswer,
          at: a.completedAt,
          timesMissed: (prev?.timesMissed || 0) + (ans.isCorrect ? 0 : 1),
        });
      }
    }

    const user = await User.findById(req.userId).select('clearedMistakes');
    const clearedAt = new Map((user?.clearedMistakes || []).map(c => [String(c.question), c.at]));
    const missed = [...latest.entries()]
      .filter(([qid, v]) => !v.isCorrect && !(clearedAt.get(qid) > v.at))
      .sort((a, b) => b[1].at - a[1].at)
      .slice(0, 200);

    const questions = await Question.find({ _id: { $in: missed.map(([qid]) => qid) } });
    const byId = new Map(questions.map(q => [String(q._id), q]));
    const quizzes = await Quiz.find({ _id: { $in: [...new Set(missed.map(([, v]) => String(v.quizId)))] } });
    const quizById = new Map(quizzes.map(q => [String(q._id), q]));

    // Only quizzes where revealing answers is safe right now
    const allowed = new Map();
    for (const quiz of quizzes) allowed.set(String(quiz._id), (await practiceGate(req, quiz)).ok === true);

    const items = missed
      .filter(([qid, v]) => byId.has(qid) && allowed.get(String(v.quizId)))
      .map(([qid, v]) => {
        const q = byId.get(qid);
        const quiz = quizById.get(String(v.quizId));
        return {
          question: publicQuestion(q),
          correctOptionId: q.options.find(o => o.isCorrect)?._id || null,
          explanation: q.explanation || '',
          yourAnswer: v.selectedAnswer || '',
          timesMissed: v.timesMissed,
          lastMissedAt: v.at,
          quiz: { _id: quiz._id, title: quiz.title, category: quiz.category },
        };
      });

    res.json({ mistakes: items, total: items.length });
  } catch (err) {
    console.error('Mistakes error:', err);
    res.status(500).json({ message: 'Server error loading your mistakes' });
  }
};

// ── Saved quizzes ────────────────────────────────────────────────────────────

// GET /api/users/me/saved — saved quizzes the user can still open, newest saves first
exports.getSaved = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('savedQuizzes');
    const ids = [...(user?.savedQuizzes || [])].reverse();
    const filter = await visibleQuizFilter(req);
    const quizzes = await Quiz.find({ ...filter, _id: { $in: ids } }).populate('createdBy', 'name');
    const order = new Map(ids.map((id, i) => [String(id), i]));
    quizzes.sort((a, b) => order.get(String(a._id)) - order.get(String(b._id)));
    res.json({ quizzes, ids: quizzes.map(q => q._id) });
  } catch (err) {
    console.error('Saved quizzes error:', err);
    res.status(500).json({ message: 'Server error loading saved quizzes' });
  }
};

// PUT /api/users/me/saved/:quizId
exports.saveQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz || !(await canAccessQuiz(req, quiz))) return res.status(404).json({ message: 'Quiz not found' });
    await User.updateOne({ _id: req.userId }, { $addToSet: { savedQuizzes: quiz._id } });
    res.json({ saved: true });
  } catch (err) {
    console.error('Save quiz error:', err);
    res.status(500).json({ message: 'Server error saving quiz' });
  }
};

// DELETE /api/users/me/saved/:quizId
exports.unsaveQuiz = async (req, res) => {
  try {
    await User.updateOne({ _id: req.userId }, { $pull: { savedQuizzes: req.params.quizId } });
    res.json({ saved: false });
  } catch (err) {
    console.error('Unsave quiz error:', err);
    res.status(500).json({ message: 'Server error removing saved quiz' });
  }
};
