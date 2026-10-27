const mongoose = require('mongoose');
const Quiz = require('../models/quiz.model');
const Question = require('../models/question.model');
const Attempt = require('../models/attempt.model');
const User = require('../models/user.model');
const Assignment = require('../models/assignment.model');
const QuizSession = require('../models/quizSession.model');

const { normalizeProctoring, sanitizeViolations } = require('../utils/proctoring');
const { visibleQuizFilter, canAccessQuiz, canManageQuiz, escapeRegex } = require('../utils/quizAccess');
const { checkAssignmentRules } = require('../utils/assignmentRules');

/** Platform admins can touch any quiz; org admins only their own organisation's. */
const assertQuizOwnership = async (req, quiz) => {
  if (req.userRole === 'admin') return;
  const user = await User.findById(req.userId).select('orgId');
  if (!user?.orgId || String(quiz.organization) !== String(user.orgId)) {
    const err = new Error('Access denied — this quiz belongs to another organisation');
    err.status = 403;
    throw err;
  }
};

// Get all quizzes (with filters)

// Fields a client may sort the public list by
const SORTABLE = new Set(['createdAt', 'title', 'totalAttempts', 'timeLimit', 'difficulty']);

exports.getAllQuizzes = async (req, res, next) => {
  try {
    const { search = '', category = '', difficulty = '', sortBy = 'createdAt', order = 'desc' } = req.query;
    // Clamp paging so bad input can't reach Mongo as a negative skip/limit
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 100);
    const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);

    // Only published quizzes the requester may take (platform + their own organisation's)
    const query = await visibleQuizFilter(req);

    if (search) {
      const rx = new RegExp(escapeRegex(String(search).slice(0, 100)), 'i');
      query.$and = [{ $or: [{ title: rx }, { description: rx }] }];
    }
    if (category) query.category = String(category);
    if (difficulty) query.difficulty = String(difficulty).toLowerCase();

    const sort = { [SORTABLE.has(sortBy) ? sortBy : 'createdAt']: order === 'asc' ? 1 : -1 };

    const [quizzes, total] = await Promise.all([
      Quiz.find(query)
        .populate('createdBy', 'name')   // never expose author emails publicly
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit),
      Quiz.countDocuments(query),
    ]);

    res.status(200).json({
      quizzes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    next(error);
  }
};


// Get quiz by ID with questions
exports.getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }

    const quiz = await Quiz.findById(id).populate('createdBy', 'name');

    // Drafts and other organisations' quizzes look exactly like missing ones
    if (!quiz || !(await canAccessQuiz(req, quiz))) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Enforce scheduling window for non-admins
    if (req.userRole !== 'admin') {
      const now = new Date();
      if (quiz.startDate && now < new Date(quiz.startDate)) {
        return res.status(403).json({ message: 'This quiz is not available yet.' });
      }
      if (quiz.endDate && now > new Date(quiz.endDate)) {
        return res.status(403).json({ message: 'This quiz has expired.' });
      }
    }

    const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1, createdAt: 1 });

    // Strip isCorrect and explanations so answers can't be read before submitting
    // (both are returned with the attempt afterwards)
    res.json({
      quiz,
      questions: questions.map(q => ({
        _id: q._id,
        text: q.text,
        type: q.type,
        points: q.points,
        options: q.options.map(opt => ({
          _id: opt._id,
          text: opt.text
        }))
      }))
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Server error fetching quiz' });
  }
};

// Update quiz (admin only)
exports.updateQuiz = async (req, res) => {
  try {
    const { title, description, category, difficulty, timeLimit, passScore, isPublished, startDate, endDate, tags, proctoring } = req.body;

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    await assertQuizOwnership(req, quiz);

    if (title) quiz.title = title;
    if (description) quiz.description = description;
    if (category) quiz.category = category;
    if (difficulty) quiz.difficulty = difficulty;
    if (timeLimit != null) quiz.timeLimit = timeLimit;
    if (passScore != null) quiz.passScore = passScore;
    if (typeof isPublished !== 'undefined') {
      // A published quiz with nothing in it just dead-ends students
      if (isPublished === true && !quiz.isPublished && !(await Question.exists({ quizId: quiz._id }))) {
        return res.status(400).json({ message: 'Add at least one question before publishing this quiz.' });
      }
      quiz.isPublished = isPublished === true;
    }
    if (startDate !== undefined) quiz.startDate = startDate || null;
    if (endDate !== undefined) quiz.endDate = endDate || null;
    if (quiz.startDate && quiz.endDate && quiz.endDate <= quiz.startDate) {
      return res.status(400).json({ message: 'End date must be after the start date.' });
    }
    if (Array.isArray(tags)) quiz.tags = tags;
    // Merge with the saved settings so a partial update doesn't reset the rest
    const nextProctoring = normalizeProctoring(proctoring, quiz.proctoring);
    if (nextProctoring) quiz.proctoring = nextProctoring;

    const updatedQuiz = await quiz.save();

    res.json({
      message: 'Quiz updated successfully',
      quiz: updatedQuiz
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: Object.values(error.errors || {}).map(e => e.message).join(' ') || 'Invalid quiz details' });
    }
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Server error updating quiz' });
  }
};

// Delete quiz (admin only)
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    await assertQuizOwnership(req, quiz);

    // Questions, assignments and open sessions go with the quiz. Past attempts are
    // kept so students' history and scores survive; they show as a deleted quiz.
    await Question.deleteMany({ quizId: quiz._id });
    await Assignment.deleteMany({ quiz: quiz._id });
    await QuizSession.deleteMany({ quiz: quiz._id });

    // Delete the quiz
    await Quiz.findByIdAndDelete(quiz._id);

    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error deleting quiz' });
  }
};

// ── Quiz sessions & assignment rules ─────────────────────────────────────────

// Extra time allowed past the limit for network latency / auto-submit
const SUBMIT_GRACE_MS = 2 * 60 * 1000;
// How long an untimed quiz session stays open
const UNTIMED_SESSION_MS = 6 * 60 * 60 * 1000;

const sessionWindowMs = quiz => (quiz.timeLimit ? quiz.timeLimit * 60 * 1000 + SUBMIT_GRACE_MS : UNTIMED_SESSION_MS);

const pctOf = a => (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0);

// Shared gate for starting and submitting
const loadTakeableQuiz = async (req, quizId) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz || !(await canAccessQuiz(req, quiz))) return { status: 404, message: 'Quiz not found' };
  const now = new Date();
  if (req.userRole !== 'admin') {
    if (quiz.startDate && now < quiz.startDate) return { status: 403, message: 'This quiz is not available yet.' };
    if (quiz.endDate && now > quiz.endDate) return { status: 403, message: 'This quiz has expired.' };
  }
  const rules = await checkAssignmentRules(req.userId, quiz);
  if (!rules.ok) return { status: 403, message: rules.message };
  return { quiz, attemptsLeft: rules.attemptsLeft };
};

// GET /api/quizzes/:id/eligibility — can this user take the quiz right now, and how many attempts are left
exports.getQuizEligibility = async (req, res) => {
  try {
    const gate = await loadTakeableQuiz(req, req.params.id);
    if (gate.status === 404) return res.status(404).json({ message: gate.message });
    res.json(gate.status
      ? { canTake: false, reason: gate.message }
      : { canTake: true, attemptsLeft: gate.attemptsLeft ?? null });
  } catch (error) {
    console.error('Quiz eligibility error:', error);
    res.status(500).json({ message: 'Server error checking quiz' });
  }
};

// POST /api/quizzes/:id/start — opens (or resumes) a timed session
exports.startQuiz = async (req, res) => {
  try {
    const gate = await loadTakeableQuiz(req, req.params.id);
    if (gate.status) return res.status(gate.status).json({ message: gate.message });
    const { quiz } = gate;

    if (!(await Question.exists({ quizId: quiz._id }))) {
      return res.status(400).json({ message: 'This quiz has no questions yet.' });
    }

    const now = new Date();
    // Reuse a live session so a refresh doesn't reset the timer
    let session = await QuizSession.findOne({ user: req.userId, quiz: quiz._id, expiresAt: { $gt: now } }).sort({ startedAt: -1 });
    if (!session) {
      session = await QuizSession.create({
        user: req.userId, quiz: quiz._id, startedAt: now,
        expiresAt: new Date(now.getTime() + sessionWindowMs(quiz)),
      });
    }

    res.status(201).json({
      startedAt: session.startedAt,
      serverNow: now,
      timeLimit: quiz.timeLimit || null,
      attemptsLeft: gate.attemptsLeft ?? null,
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    res.status(500).json({ message: 'Server error starting quiz' });
  }
};

exports.submitQuizAttempt = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const { answers, violations, autoSubmitted } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers are required and must be an array' });
    }

    const gate = await loadTakeableQuiz(req, quizId);
    if (gate.status) return res.status(gate.status).json({ message: gate.message });
    const { quiz } = gate;

    // Timing comes from the server-side session, never from the client
    const now = new Date();
    const session = await QuizSession.findOne({ user: req.userId, quiz: quiz._id }).sort({ startedAt: -1 });
    if (!session) {
      return res.status(400).json({ message: 'Your quiz session has expired. Please start the quiz again.' });
    }

    const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1, createdAt: 1 });
    if (!questions.length) {
      return res.status(404).json({ message: 'No questions found for this quiz' });
    }

    // First well-formed answer per question wins; anything malformed is ignored
    const chosen = new Map();
    for (const a of answers) {
      if (!a || typeof a !== 'object') continue;
      const qid = typeof a.questionId === 'string' ? a.questionId : null;
      const oid = typeof a.selectedOptionId === 'string' ? a.selectedOptionId : null;
      if (qid && oid && !chosen.has(qid)) chosen.set(qid, oid);
    }

    let score = 0;
    let maxScore = 0;
    const processedAnswers = questions.map(question => {
      const points = Math.max(0, question.points || 0);
      maxScore += points;
      const option = question.options.find(o => o._id.toString() === chosen.get(question._id.toString()));
      const isCorrect = option?.isCorrect === true;
      if (isCorrect) score += points;
      return {
        questionId: question._id,
        selectedAnswer: option ? option.text : '',
        isCorrect,
        pointsEarned: isCorrect ? points : 0,
      };
    });

    // Only record proctoring data when the quiz actually has it switched on
    const proctoringOn = quiz.proctoring?.enabled === true;
    const cleanViolations = proctoringOn ? sanitizeViolations(violations) : [];

    const attempt = await Attempt.create({
      user: req.userId,
      quiz: quiz._id,
      score,
      maxScore,
      startedAt: session.startedAt,
      completedAt: now,
      answers: processedAnswers,
      proctored: proctoringOn,
      violations: cleanViolations,
      violationCount: cleanViolations.length,
      autoSubmitted: proctoringOn && autoSubmitted === true
    });

    await QuizSession.deleteMany({ user: req.userId, quiz: quiz._id });
    await Quiz.updateOne({ _id: quiz._id }, { $inc: { totalAttempts: 1 } });

    return res.status(201).json({
      message: 'Quiz submitted successfully',
      attemptId: attempt._id,
      score,
      maxScore,
      percentageScore: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return res.status(500).json({ message: 'Server error submitting quiz' });
  }
};

/**
 * Loads an attempt for the requester, or returns { status, message }.
 * Visible to its owner, platform admins, and admins of the quiz's organisation.
 * While an assignment still allows more attempts, correct answers stay hidden
 * so the review can't be used to ace the next attempt.
 */
const loadAttemptForViewer = async req => {
  const attempt = await Attempt.findById(req.params.id)
    .populate('quiz')
    .populate('user', 'name');
  if (!attempt) return { status: 404, message: 'Attempt not found' };

  const isOwner = String(attempt.user?._id) === String(req.userId);
  const quizMissing = !attempt.quiz;
  if (!isOwner && req.userRole !== 'admin' && (quizMissing || !(await canManageQuiz(req, attempt.quiz)))) {
    return { status: 404, message: 'Attempt not found' };
  }
  if (quizMissing) return { status: 404, message: 'The quiz for this attempt has been deleted' };

  let reviewLocked = false;
  if (isOwner) {
    const rules = await checkAssignmentRules(req.userId, attempt.quiz);
    reviewLocked = rules.ok && typeof rules.attemptsLeft === 'number' && rules.attemptsLeft > 0;
  }

  const questions = await Question.find({ quizId: attempt.quiz._id }).sort({ order: 1, createdAt: 1 });
  const shapeQuestion = q => ({
    _id: q._id,
    text: q.text,
    type: q.type,
    points: q.points,
    ...(reviewLocked ? {} : { explanation: q.explanation }),
    options: q.options.map(o => ({ _id: o._id, text: o.text, ...(reviewLocked ? {} : { isCorrect: o.isCorrect }) })),
  });
  return { attempt, questions: questions.map(shapeQuestion), reviewLocked };
};

exports.getQuizAttemptById = async (req, res) => {
  try {
    const result = await loadAttemptForViewer(req);
    if (result.status) return res.status(result.status).json({ message: result.message });
    const { attempt, questions, reviewLocked } = result;
    const byId = new Map(questions.map(q => [String(q._id), q]));

    res.json({
      attempt: {
        ...attempt.toObject(),
        answers: attempt.answers.map(a => ({ ...a.toObject(), question: byId.get(String(a.questionId)) || null })),
      },
      quiz: { ...attempt.quiz.toObject(), questions },
      reviewLocked,
    });
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ message: 'Server error fetching attempt details' });
  }
};

// GET /api/attempts/:id — same access rules, in the shape the attempt review page reads
exports.getAttemptDetail = async (req, res) => {
  try {
    const result = await loadAttemptForViewer(req);
    if (result.status) return res.status(result.status).json({ success: false, message: result.message });
    const { attempt, questions, reviewLocked } = result;
    res.json({
      success: true,
      reviewLocked,
      attempt: { ...attempt.toObject(), quiz: { ...attempt.quiz.toObject(), questions } },
    });
  } catch (error) {
    console.error('Get attempt detail error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching attempt' });
  }
};

// Get all completed attempts for the signed-in user
exports.getUserAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ user: req.userId, completedAt: { $ne: null } })
      .populate('quiz', 'title category difficulty passScore timeLimit')
      .select('-answers')
      .sort({ completedAt: -1 });

    res.json({ attempts });
  } catch (error) {
    console.error('Get user attempts error:', error);
    res.status(500).json({ message: 'Server error fetching attempts' });
  }
};

// Results are for the people who run the quiz: platform admins and its organisation's admins
const loadManagedQuiz = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) { res.status(404).json({ message: 'Quiz not found' }); return null; }
  if (!(await canManageQuiz(req, quiz))) {
    res.status(403).json({ message: 'Only this quiz\'s administrators can see its results' });
    return null;
  }
  return quiz;
};

exports.getQuizStatistics = async (req, res) => {
  try {
    const quiz = await loadManagedQuiz(req, res);
    if (!quiz) return;

    const attempts = await Attempt.find({ quiz: quiz._id, completedAt: { $ne: null }, maxScore: { $gt: 0 } });
    const passMark = quiz.passScore ?? 40;

    if (!attempts.length) {
      return res.json({
        statistics: { totalAttempts: 0, averageScore: 0, passRate: 0, passScore: passMark, uniqueUsers: 0, questionStats: [] },
      });
    }

    const totalAttempts = attempts.length;
    const averageScore = attempts.reduce((sum, a) => sum + pctOf(a), 0) / totalAttempts;
    const passRate = (attempts.filter(a => pctOf(a) >= passMark).length / totalAttempts) * 100;
    const uniqueUsers = new Set(attempts.map(a => a.user?.toString()).filter(Boolean)).size;

    const questions = await Question.find({ quizId: quiz._id }).sort({ order: 1, createdAt: 1 });
    const questionStats = questions.map(q => {
      const stats = { text: q.text, correctCount: 0, totalAttempts: 0, successRate: 0 };
      attempts.forEach(attempt => {
        const answer = attempt.answers?.find(ans => ans.questionId && ans.questionId.toString() === q._id.toString());
        if (answer) {
          stats.totalAttempts++;
          if (answer.isCorrect) stats.correctCount++;
        }
      });
      stats.successRate = stats.totalAttempts > 0 ? (stats.correctCount / stats.totalAttempts) * 100 : 0;
      return stats;
    });

    res.json({
      statistics: { totalAttempts, averageScore, passRate, passScore: passMark, uniqueUsers, questionStats },
    });
  } catch (err) {
    console.error('Error calculating statistics:', err);
    res.status(500).json({ message: 'Error calculating statistics' });
  }
};

exports.getRecentAttemptsByQuizId = async (req, res) => {
  try {
    const quiz = await loadManagedQuiz(req, res);
    if (!quiz) return;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const attempts = await Attempt.find({ quiz: quiz._id, completedAt: { $ne: null } })
      .sort({ completedAt: -1 })
      .limit(limit)
      .populate('user', 'name email');

    res.json({
      attempts: attempts.map(attempt => ({
        _id: attempt._id,
        score: Math.round(pctOf(attempt)),
        timeTaken: attempt.completedAt && attempt.startedAt
          ? Math.floor((attempt.completedAt - attempt.startedAt) / 1000)
          : null,
        createdAt: attempt.createdAt,
        user: attempt.user ? { name: attempt.user.name, email: attempt.user.email } : null,
      })),
    });
  } catch (err) {
    console.error('Recent attempts error:', err);
    res.status(500).json({ message: 'Error fetching attempts' });
  }
};

/**
 * GET /api/quizzes/leaderboard
 * - With ?quizId: best attempt per user on that quiz (quiz must be visible to the viewer).
 * - Without: overall ranking on public quizzes — each user's best score per quiz,
 *   averaged across the quizzes they've taken; more quizzes breaks ties, then less time.
 * Organisation-only and draft quizzes never appear on the public board.
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const quizId = req.query.quizId && mongoose.Types.ObjectId.isValid(req.query.quizId) ? req.query.quizId : null;

    let quizIds;
    if (quizId) {
      const quiz = await Quiz.findById(quizId);
      if (!quiz || !(await canAccessQuiz(req, quiz))) return res.status(404).json({ message: 'Quiz not found' });
      quizIds = [quiz._id];
    } else {
      quizIds = (await Quiz.find({ isPublished: true, organization: null }).select('_id')).map(q => q._id);
    }

    const bestPerQuiz = [
      { $match: { quiz: { $in: quizIds }, completedAt: { $ne: null }, maxScore: { $gt: 0 } } },
      { $addFields: {
          pct: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] },
          secs: { $divide: [{ $subtract: ['$completedAt', '$startedAt'] }, 1000] },
      } },
      { $sort: { pct: -1, secs: 1 } },
      { $group: { _id: { user: '$user', quiz: '$quiz' }, pct: { $first: '$pct' }, secs: { $first: '$secs' },
                  completedAt: { $first: '$completedAt' }, attemptId: { $first: '$_id' } } },
    ];

    const rank = quizId
      ? [
          { $project: { _id: '$_id.user', quiz: '$_id.quiz', score: '$pct', timeTaken: '$secs', completedAt: 1, attemptId: 1, quizzesTaken: { $literal: 1 } } },
        ]
      : [
          { $group: { _id: '$_id.user', score: { $avg: '$pct' }, quizzesTaken: { $sum: 1 },
                      timeTaken: { $sum: '$secs' }, completedAt: { $max: '$completedAt' } } },
        ];

    const leaderboard = await Attempt.aggregate([
      ...bestPerQuiz,
      ...rank,
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
      // Attempts by deleted users don't belong on the board
      { $match: { 'userInfo.0': { $exists: true } } },
      { $sort: { score: -1, quizzesTaken: -1, timeTaken: 1 } },
      { $limit: limit },
      ...(quizId ? [{ $lookup: { from: 'quizzes', localField: 'quiz', foreignField: '_id', as: 'quizInfo' } }] : []),
      { $project: {
          _id: 0,
          score: { $round: ['$score', 1] },
          timeTaken: { $round: ['$timeTaken', 0] },
          quizzesTaken: 1,
          completedAt: 1,
          attemptId: 1,
          user: { _id: { $arrayElemAt: ['$userInfo._id', 0] }, name: { $arrayElemAt: ['$userInfo.name', 0] } },
          ...(quizId ? { quiz: { _id: { $arrayElemAt: ['$quizInfo._id', 0] }, title: { $arrayElemAt: ['$quizInfo.title', 0] } } } : {}),
      } },
    ]);

    res.json({ leaderboard, mode: quizId ? 'quiz' : 'overall' });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
};

// GET /api/stats — public platform stats for Home page
exports.getPlatformStats = async (req, res) => {
  try {
    const [totalQuizzes, totalUsers, totalAttempts] = await Promise.all([
      Quiz.countDocuments({ isPublished: true, organization: null }),
      require('../models/user.model').countDocuments(),
      Attempt.countDocuments({ completedAt: { $ne: null } })
    ]);
    res.json({ totalQuizzes, totalUsers, totalAttempts });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

