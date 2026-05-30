const Assignment = require('../models/assignment.model');
const Batch      = require('../models/batch.model');
const Attempt    = require('../models/attempt.model');
const User       = require('../models/user.model');
const Quiz       = require('../models/quiz.model');

const getOrgId = async (userId) => (await User.findById(userId).select('orgId'))?.orgId;

// ── Assign a quiz to a batch ──────────────────────────────────────────────────
exports.createAssignment = async (req, res) => {
  try {
    const orgId = await getOrgId(req.userId);
    if (!orgId) return res.status(403).json({ message: 'No organisation' });

    const { quizId, batchId, title, instructions, startDate, dueDate, maxAttempts, passingScore } = req.body;

    const batch = await Batch.findOne({ _id: batchId, organization: orgId });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const assignment = await Assignment.create({
      quiz:         quizId,
      batch:        batchId,
      organization: orgId,
      assignedBy:   req.userId,
      title,
      instructions,
      startDate:    startDate || new Date(),
      dueDate:      dueDate   || null,
      maxAttempts:  maxAttempts || 1,
      passingScore: passingScore || null
    });

    await assignment.populate('quiz', 'title category difficulty timeLimit');
    await assignment.populate('batch', 'name');

    res.status(201).json({ message: 'Quiz assigned', assignment });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'This quiz is already assigned to that batch' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Get all assignments for org ───────────────────────────────────────────────
exports.getAssignments = async (req, res) => {
  try {
    const orgId = await getOrgId(req.userId);
    if (!orgId) return res.status(403).json({ message: 'No organisation' });

    const { batchId } = req.query;
    const query = { organization: orgId, isActive: true };
    if (batchId) query.batch = batchId;

    const assignments = await Assignment.find(query)
      .populate('quiz',  'title category difficulty timeLimit totalQuestions')
      .populate('batch', 'name color')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Get assignments for the logged-in student ─────────────────────────────────
exports.getMyAssignments = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('batchIds orgId');
    if (!user?.batchIds?.length) return res.json({ assignments: [] });

    const now = new Date();
    const assignments = await Assignment.find({
      batch:    { $in: user.batchIds },
      isActive: true,
      $or: [
        { startDate: { $lte: now } },
        { startDate: null }
      ]
    })
      .populate('quiz',  'title category difficulty timeLimit totalQuestions passScore')
      .populate('batch', 'name color')
      .sort({ dueDate: 1, createdAt: -1 });

    // For each assignment, check how many attempts the student already has
    const withStatus = await Promise.all(assignments.map(async asgn => {
      const attemptsCount = await Attempt.countDocuments({
        user:        req.userId,
        quiz:        asgn.quiz,
        completedAt: { $ne: null }
      });
      const lastAttempt = await Attempt.findOne({
        user:        req.userId,
        quiz:        asgn.quiz,
        completedAt: { $ne: null }
      }).sort({ completedAt: -1 }).select('score maxScore completedAt');

      const pct = lastAttempt?.maxScore > 0
        ? Math.round((lastAttempt.score / lastAttempt.maxScore) * 100)
        : null;

      return {
        ...asgn.toObject(),
        attemptsUsed:  attemptsCount,
        attemptsLeft:  Math.max(0, asgn.maxAttempts - attemptsCount),
        canAttempt:    attemptsCount < asgn.maxAttempts,
        lastScore:     pct,
        isOverdue:     asgn.dueDate && new Date(asgn.dueDate) < now && attemptsCount === 0,
        isDue:         asgn.dueDate && new Date(asgn.dueDate) < now
      };
    }));

    res.json({ assignments: withStatus });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Get results for a single assignment ──────────────────────────────────────
exports.getAssignmentResults = async (req, res) => {
  try {
    const orgId = await getOrgId(req.userId);
    const asgn  = await Assignment.findOne({ _id: req.params.id, organization: orgId })
      .populate('quiz', 'title passScore')
      .populate('batch', 'name students');

    if (!asgn) return res.status(404).json({ message: 'Assignment not found' });

    const students = await User.find({ _id: { $in: asgn.batch.students } }).select('name email');

    const results = await Promise.all(students.map(async s => {
      const attempts = await Attempt.find({
        user:        s._id,
        quiz:        asgn.quiz._id,
        completedAt: { $ne: null }
      }).sort({ score: -1 }).select('score maxScore completedAt startedAt');

      const best = attempts[0];
      const pct  = best?.maxScore > 0 ? Math.round((best.score / best.maxScore) * 100) : null;

      return {
        student:  { _id: s._id, name: s.name, email: s.email },
        attempts: attempts.length,
        bestScore: pct,
        passed:   pct !== null && pct >= (asgn.passingScore ?? asgn.quiz.passScore ?? 40),
        completedAt: best?.completedAt || null
      };
    }));

    const completed = results.filter(r => r.attempts > 0).length;
    const passed    = results.filter(r => r.passed).length;

    res.json({
      assignment: asgn,
      results,
      summary: {
        total:     students.length,
        completed,
        passed,
        avgScore:  results.filter(r => r.bestScore !== null).reduce((s, r) => s + r.bestScore, 0) /
                   (results.filter(r => r.bestScore !== null).length || 1)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Update assignment ─────────────────────────────────────────────────────────
exports.updateAssignment = async (req, res) => {
  try {
    const orgId = await getOrgId(req.userId);
    const asgn  = await Assignment.findOne({ _id: req.params.id, organization: orgId });
    if (!asgn) return res.status(404).json({ message: 'Assignment not found' });

    ['title', 'instructions', 'startDate', 'dueDate', 'maxAttempts', 'passingScore', 'isActive'].forEach(k => {
      if (req.body[k] !== undefined) asgn[k] = req.body[k];
    });
    await asgn.save();
    res.json({ message: 'Assignment updated', assignment: asgn });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Delete assignment ─────────────────────────────────────────────────────────
exports.deleteAssignment = async (req, res) => {
  try {
    const orgId = await getOrgId(req.userId);
    const asgn  = await Assignment.findOneAndDelete({ _id: req.params.id, organization: orgId });
    if (!asgn) return res.status(404).json({ message: 'Assignment not found' });
    res.json({ message: 'Assignment removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
