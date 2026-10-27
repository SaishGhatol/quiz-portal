// server/controllers/admin.controller.js
const mongoose = require('mongoose');
const Quiz         = require('../models/quiz.model');
const User          = require('../models/user.model');
const Attempt       = require('../models/attempt.model');
const Question      = require('../models/question.model');
const Review        = require('../models/review.model');
const Organization  = require('../models/organization.model');
const Batch         = require('../models/batch.model');
const { normalizeProctoring } = require('../utils/proctoring');
const { canManageQuiz, escapeRegex } = require('../utils/quizAccess');
const { PLANS, withinLimit } = require('../config/plans');

const USER_ROLES = ['user', 'admin', 'org_admin', 'teacher'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const QUESTION_SORT = { order: 1, createdAt: 1 };
const MAX_QUIZ_PAGE = 500;
const MAX_USER_PAGE = 500;

// "Active" in the database: accounts created before isActive existed have no field and count as active
const ACTIVE_FILTER = { isActive: { $ne: false } };

/** Parses an integer query value and clamps it into [min, max] */
const clampInt = (value, fallback, min, max) => {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/** Mongoose ValidationError → readable { message, errors[] } (no internals like "Cast to date failed …") */
const validationDetails = err => {
  const errors = Object.values(err.errors || {}).map(e =>
    e.name === 'CastError' ? `Invalid value for ${e.path}` : e.message
  );
  return { message: errors[0] || 'Invalid data', errors };
};

/** Quoted CSV cell; values starting with = + - @ tab or CR are prefixed with ' so spreadsheets don't run them */
const csvCell = value => {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

/**
 * Message explaining why an organisation can't add another quiz, or null when it can.
 * Limits come from the plan definition (config/plans.js), not org.limits, which is a
 * snapshot taken when the organisation was created and goes stale after an upgrade.
 */
const quizLimitMessage = async (organizationId, verb = 'create') => {
  if (!organizationId) return null;
  const org = await Organization.findById(organizationId).select('plan');
  if (!org) return null;
  const plan = PLANS[org.plan] || PLANS.free;
  const limit = plan.limits.maxQuizzes;
  if (limit === -1) return null;
  const count = await Quiz.countDocuments({ organization: organizationId });
  if (withinLimit(count, limit)) return null;
  return `Your ${plan.label} plan allows up to ${limit} quizzes. Upgrade your plan to ${verb} more.`;
};

/** Pass/fail against a quiz's own pass mark (a percentage); null when the quiz is gone */
const passedFor = (pct, passScore) => (typeof passScore === 'number' ? pct >= passScore : null);

// ── Multi-tenant scoping helpers ────────────────────────────────────────────
// Platform admins (role 'admin') see/manage everything.
// Org admins are scoped to their own organisation's quizzes and data only —
// without this, any coaching institute admin could see or edit another
// institute's quizzes, questions and student data.

const getRequestOrgId = async (req) => {
  if (req.userRole === 'admin') return null; // unrestricted
  const user = await User.findById(req.userId).select('orgId');
  return user?.orgId || null;
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      const [totalQuizzes, totalUsers, totalAttempts, activeUsersCount] = await Promise.all([
        Quiz.countDocuments(),
        User.countDocuments(),
        Attempt.countDocuments(),
        User.countDocuments({
          lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      ]);
      return res.status(200).json({ totalQuizzes, totalUsers, totalAttempts, activeUsers: activeUsersCount });
    }

    // Org admin: numbers scoped to their own organisation only
    const orgId = await getRequestOrgId(req);
    if (!orgId) return res.status(200).json({ totalQuizzes: 0, totalUsers: 0, totalAttempts: 0, activeUsers: 0 });

    const orgQuizIds = (await Quiz.find({ organization: orgId }).select('_id')).map(q => q._id);
    const [totalQuizzes, totalUsers, totalAttempts, activeUsersCount] = await Promise.all([
      orgQuizIds.length,
      User.countDocuments({ orgId }),
      Attempt.countDocuments({ quiz: { $in: orgQuizIds } }),
      User.countDocuments({
        orgId, lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    res.status(200).json({ totalQuizzes, totalUsers, totalAttempts, activeUsers: activeUsersCount });
  } catch (error) {
    next(error);
  }
};

exports.createQuiz = async (req, res, next) => {
  try {
    const { title, description, category, difficulty, timeLimit, passScore, isPublished, startDate, endDate, tags, proctoring } = req.body || {};

    let organization = null;
    if (req.userRole !== 'admin') {
      const user = await User.findById(req.userId).select('orgId');
      if (!user?.orgId)
        return res.status(403).json({ message: 'You must belong to an organisation to create quizzes' });
      organization = user.orgId;

      const limitMessage = await quizLimitMessage(organization, 'create');
      if (limitMessage) return res.status(403).json({ message: limitMessage });
    }

    const str = v => (v === undefined || v === null ? undefined : String(v));
    const num = v => (v === undefined || v === null || v === '' ? undefined : v);
    const tagList = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',') : [];

    const quiz = new Quiz({
      title:       str(title),
      description: str(description),
      category:    str(category),
      difficulty,
      timeLimit:   num(timeLimit),
      passScore:   num(passScore),
      // A brand-new quiz has no questions yet, so it always starts as a draft: publishing
      // it would list a quiz nobody can take. It's published once questions are added.
      isPublished: false,
      startDate: startDate || null,
      endDate: endDate || null,
      tags: tagList.map(t => String(t).trim()).filter(Boolean),
      proctoring: normalizeProctoring(proctoring),
      createdBy: req.userId,
      organization
    });

    const savedQuiz = await quiz.save();
    const wantedPublished = isPublished === true || isPublished === 'true';
    res.status(201).json({
      message: wantedPublished
        ? 'Quiz saved as a draft — add questions, then publish it.'
        : 'Quiz created successfully',
      publishDeferred: wantedPublished,
      quiz: savedQuiz
    });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json(validationDetails(error));
    console.error('Create quiz error:', error);
    next(error);
  }
};

const USER_SORT_FIELDS = new Set(['name', 'email', 'role', 'createdAt', 'lastLoginAt', 'isActive']);

exports.getAllUsers = async (req, res, next) => {
  try {
    const { search = '', sortField = 'name', sortDirection = 'asc', role, status } = req.query;
    const page  = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 10, 1, MAX_USER_PAGE);

    const query = {};

    // Search is matched literally, never as a regular expression
    if (typeof search === 'string' && search.trim()) {
      const re = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [{ name: re }, { email: re }];
    }

    if (typeof role === 'string' && role && role !== 'all') {
      if (!USER_ROLES.includes(role)) return res.status(400).json({ message: 'Unknown role filter' });
      query.role = role;
    }

    if (status === 'active') Object.assign(query, ACTIVE_FILTER);
    else if (status === 'inactive') query.isActive = false;

    const field = USER_SORT_FIELDS.has(sortField) ? sortField : 'name';
    const sort = { [field]: sortDirection === 'desc' ? -1 : 1, _id: 1 };

    const [users, total] = await Promise.all([
      User.find(query).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(query)
    ]);

    // One aggregate for everyone's attempt stats instead of two queries per user
    const stats = await Attempt.aggregate([
      { $match: { user: { $in: users.map(u => u._id) } } },
      { $group: { _id: '$user', attemptCount: { $sum: 1 }, lastActivity: { $max: '$createdAt' } } }
    ]);
    const byUser = new Map(stats.map(s => [String(s._id), s]));

    const enhancedUsers = users.map(user => ({
      ...user,
      isActive: user.isActive !== false,
      attemptCount: byUser.get(String(user._id))?.attemptCount || 0,
      lastActivity: byUser.get(String(user._id))?.lastActivity || null
    }));

    res.status(200).json({
      users: enhancedUsers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalUsers: total
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isActive = user.isActive !== false;

    // Recent attempts, with the quiz title for the activity list
    const attempts = await Attempt.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-answers -violations')
      .populate('quiz', 'title passScore');

    const attemptCount = await Attempt.countDocuments({ user: userId });

    res.status(200).json({
      user,
      recentAttempts: attempts,
      attemptCount
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password, // Note: Password should be hashed in the User model pre-save hook
      role: role || 'user',
      isActive: true,
      createdAt: new Date()
    });

    await user.save();

    // Return the user without password
    const newUser = user.toObject();
    delete newUser.password;

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    next(error);
  }
};

/** Whether demoting / deactivating / deleting `user` would leave the platform without an active admin */
const isLastActiveAdmin = async user => {
  if (user.role !== 'admin' || user.isActive === false) return false;
  const others = await User.countDocuments({ _id: { $ne: user._id }, role: 'admin', ...ACTIVE_FILTER });
  return others === 0;
};

exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { name, email, role, isActive } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const update = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ message: 'Name cannot be empty' });
      if (name.trim().length > 100) return res.status(400).json({ message: 'Name must be 100 characters or fewer' });
      update.name = name.trim();
    }
    if (email !== undefined) {
      if (typeof email !== 'string' || email.length > 254 || !EMAIL_RE.test(email.trim()))
        return res.status(400).json({ message: 'Please enter a valid email address' });
      update.email = email.trim().toLowerCase();
    }
    if (role !== undefined) {
      if (!USER_ROLES.includes(role)) return res.status(400).json({ message: `Role must be one of: ${USER_ROLES.join(', ')}` });
      update.role = role;
    }
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be true or false' });
      update.isActive = isActive;
    }
    if (!Object.keys(update).length) {
      return res.status(400).json({ message: 'Nothing to update — send name, email, role or isActive' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const losesAdmin   = update.role !== undefined && update.role !== 'admin' && user.role === 'admin';
    const deactivating = update.isActive === false && user.isActive !== false;

    // Admins can't lock themselves out…
    if (String(userId) === String(req.userId)) {
      if (losesAdmin)   return res.status(400).json({ message: "You can't remove your own admin role. Ask another platform admin to do it." });
      if (deactivating) return res.status(400).json({ message: "You can't deactivate your own account." });
    }

    // …and the platform always keeps at least one active admin
    if ((losesAdmin || deactivating) && await isLastActiveAdmin(user)) {
      return res.status(400).json({ message: 'This is the last active platform admin. Make someone else an admin first.' });
    }

    if (update.email && update.email !== user.email) {
      const emailExists = await User.exists({ email: update.email, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(409).json({ message: 'Email is already in use' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();
    updatedUser.isActive = updatedUser.isActive !== false;

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json(validationDetails(error));
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    if (String(userId) === String(req.userId)) {
      return res.status(400).json({ message: "You can't delete your own account." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (await isLastActiveAdmin(user)) {
      return res.status(400).json({ message: 'This is the last active platform admin and cannot be deleted.' });
    }

    // Someone who runs an organisation can't just disappear: the organisation would be left
    // with no admin, no contact and quizzes only a platform admin could edit.
    const org = await Organization.findOne({ $or: [{ createdBy: userId }, { adminUsers: userId }] }).select('name');
    if (org) {
      return res.status(409).json({
        message: `${user.name} administers "${org.name}". Hand the organisation to another admin (or remove it) first — or deactivate this account instead.`
      });
    }

    // Remove the user's personal records so nothing points at a missing account
    let QuizSession = null;
    try { QuizSession = require('../models/quizSession.model'); } catch { /* model not present */ }
    await Promise.all([
      Attempt.deleteMany({ user: userId }),
      Review.deleteMany({ userId }),
      Batch.updateMany({ students: userId }, { $pull: { students: userId } }),
      QuizSession ? QuizSession.deleteMany({ user: userId }) : null,
    ]);

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: 'User and associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getAttemptById = async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('user', 'name email')
      .populate('quiz', 'title description')
      .populate('answers.question')
      .exec();

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    res.status(200).json({ attempt });
  } catch (error) {
    next(error);
  }
};

exports.getRecentAttempts = async (req, res) => {
  try {
    const limit = 10;
    const query = { completedAt: { $ne: null } };

    // Org admins only see recent activity from their own organisation's quizzes
    if (req.userRole !== 'admin') {
      const orgId = await getRequestOrgId(req);
      const orgQuizIds = orgId
        ? (await Quiz.find({ organization: orgId }).select('_id')).map(q => q._id)
        : [];
      query.quiz = { $in: orgQuizIds };
    }

    const attempts = await Attempt.find(query)
      .sort({ completedAt: -1 })
      .limit(limit)
      .select('-answers -violations')
      .populate({
        path: 'user',
        select: 'name email',
        model: 'User',
        strictPopulate: false
      })
      .populate('quiz', 'title passScore');

    const formattedAttempts = attempts.map(attempt => {
      const percentageScore = attempt.maxScore > 0
        ? (attempt.score / attempt.maxScore) * 100
        : 0;

      // Time taken in seconds
      const timeTaken = attempt.completedAt && attempt.startedAt
        ? Math.floor((new Date(attempt.completedAt) - new Date(attempt.startedAt)) / 1000)
        : null;

      return {
        _id: attempt._id,
        score: Math.round(percentageScore),
        passed: passedFor(percentageScore, attempt.quiz?.passScore),
        timeTaken,
        createdAt: attempt.createdAt,
        completedAt: attempt.completedAt,
        quiz: attempt.quiz
          ? { _id: attempt.quiz._id, title: attempt.quiz.title, passScore: attempt.quiz.passScore }
          : null,
        user: attempt.user
          ? { name: attempt.user.name, email: attempt.user.email }
          : null,
      };
    });

    return res.json({
      success: true,
      attempts: formattedAttempts,
      count: formattedAttempts.length
    });
  } catch (err) {
    console.error('Error fetching attempts:', err);
    return res.status(500).json({
      success: false,
      message: 'Error fetching quiz attempts',
      error: process.env.NODE_ENV === 'production' ? null : err.message
    });
  }
};

const QUIZ_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'title', 'totalAttempts', 'totalQuestions', 'category']);

exports.getAllQuizzes = async (req, res, next) => {
  try {
    const { search = '', sortBy = 'createdAt', order = 'desc', status = 'all' } = req.query;
    const page  = clampInt(req.query.page, 1, 1, 100000);
    const limit = clampInt(req.query.limit, 50, 1, MAX_QUIZ_PAGE);

    // Org admins only ever see their own organisation's quizzes
    const scope = req.userRole !== 'admin' ? { organization: await getRequestOrgId(req) } : {};
    const query = { ...scope };

    // Search is matched literally, never as a regular expression
    if (typeof search === 'string' && search.trim()) {
      const re = new RegExp(escapeRegex(search.trim()), 'i');
      query.$or = [{ title: re }, { description: re }, { category: re }, { tags: re }];
    }
    if (status === 'published') query.isPublished = true;
    else if (status === 'draft') query.isPublished = false;

    const field = QUIZ_SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';
    const sort = { [field]: order === 'asc' ? 1 : -1, _id: -1 };

    const [quizzes, total, allCount, publishedCount] = await Promise.all([
      Quiz.find(query)
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      Quiz.countDocuments(query),
      Quiz.countDocuments(scope),
      Quiz.countDocuments({ ...scope, isPublished: true }),
    ]);

    res.status(200).json({
      quizzes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
      total,
      counts: { all: allCount, published: publishedCount, draft: allCount - publishedCount }
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    next(error);
  }
};

exports.getRecentQuizzes = async (req, res, next) => {
  try {
    const query = {};
    if (req.userRole !== 'admin') {
      query.organization = await getRequestOrgId(req);
    }
    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
    res.status(200).json({ quizzes, success: true });
  } catch (error) {
    console.error('Error fetching recent quizzes:', error);
    next(error);
  }
};

// Duplicate a quiz (and all its questions)
exports.duplicateQuiz = async (req, res, next) => {
  try {
    const original = await Quiz.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Quiz not found' });
    if (!(await canManageQuiz(req, original))) {
      return res.status(403).json({ message: 'Access denied — this quiz belongs to another organisation' });
    }

    const limitMessage = await quizLimitMessage(original.organization, 'duplicate');
    if (limitMessage) return res.status(403).json({ message: limitMessage });

    const suffix = ' (Copy)';
    const copy = await Quiz.create({
      title:        `${original.title.slice(0, 200 - suffix.length)}${suffix}`,
      description:  original.description,
      category:     original.category,
      difficulty:   original.difficulty,
      timeLimit:    original.timeLimit,
      passScore:    original.passScore,
      tags:         original.tags,
      startDate:    original.startDate,
      endDate:      original.endDate,
      proctoring:   original.proctoring?.toObject ? original.proctoring.toObject() : original.proctoring,
      isPublished:  false,          // copies start as draft
      createdBy:    req.userId,
      organization: original.organization,
    });

    // Copy all questions, keeping their order
    const origQuestions = await Question.find({ quizId: original._id }).sort(QUESTION_SORT).lean();
    if (origQuestions.length) {
      const cloned = origQuestions.map((q, idx) => ({
        quizId:      copy._id,
        text:        q.text,
        type:        q.type || 'single',
        options:     (q.options || []).map(o => ({ text: o.text, isCorrect: o.isCorrect === true })),
        points:      q.points,
        explanation: q.explanation,
        order:       idx,
      }));
      await Question.insertMany(cloned);
      await Quiz.findByIdAndUpdate(copy._id, { totalQuestions: cloned.length });
      copy.totalQuestions = cloned.length;
    }

    res.status(201).json({ message: 'Quiz duplicated', quiz: copy });
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json(validationDetails(error));
    next(error);
  }
};

// Update question order: body { questionIds } must list every question of the quiz exactly once
exports.updateQuestionOrder = async (req, res, next) => {
  try {
    const { questionIds } = req.body || {};
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ message: 'questionIds must be a non-empty array' });
    }
    if (questionIds.some(id => typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'questionIds contains an invalid id' });
    }
    if (new Set(questionIds).size !== questionIds.length) {
      return res.status(400).json({ message: 'questionIds contains duplicates' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (!(await canManageQuiz(req, quiz))) {
      return res.status(403).json({ message: 'Access denied — this quiz belongs to another organisation' });
    }

    const [owned, total] = await Promise.all([
      Question.countDocuments({ _id: { $in: questionIds }, quizId: quiz._id }),
      Question.countDocuments({ quizId: quiz._id }),
    ]);
    if (owned !== questionIds.length) {
      return res.status(400).json({ message: 'Some of those questions do not belong to this quiz' });
    }
    if (owned !== total) {
      return res.status(400).json({ message: 'Send every question in this quiz exactly once' });
    }

    await Question.bulkWrite(questionIds.map((qid, idx) => ({
      updateOne: { filter: { _id: qid, quizId: quiz._id }, update: { $set: { order: idx } } }
    })));
    res.json({ message: 'Order updated' });
  } catch (error) {
    next(error);
  }
};

// ── Analytics ────────────────────────────────────────────────────────────────
exports.getAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const pctExpr = { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] };

    const [attemptsByDay, usersByDay, scoreDistRaw, topQuizzes, passStats, pendingReviews] =
      await Promise.all([
        Attempt.aggregate([
          { $match: { completedAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]),
        User.aggregate([
          { $match: { createdAt: { $gte: thirtyDaysAgo } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ]),
        Attempt.aggregate([
          { $match: { maxScore: { $gt: 0 } } },
          { $project: { pct: pctExpr } },
          { $facet: {
            a: [{ $match: { pct: { $lt: 20 } } },              { $count: 'n' }],
            b: [{ $match: { pct: { $gte: 20, $lt: 40 } } },   { $count: 'n' }],
            c: [{ $match: { pct: { $gte: 40, $lt: 60 } } },   { $count: 'n' }],
            d: [{ $match: { pct: { $gte: 60, $lt: 80 } } },   { $count: 'n' }],
            e: [{ $match: { pct: { $gte: 80 } } },             { $count: 'n' }],
          }}
        ]),
        Attempt.aggregate([
          { $match: { maxScore: { $gt: 0 } } },
          { $group: { _id: '$quiz', count: { $sum: 1 }, avgPct: { $avg: pctExpr } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $lookup: { from: 'quizzes', localField: '_id', foreignField: '_id', as: 'q' } },
          { $unwind: { path: '$q', preserveNullAndEmptyArrays: true } },
          { $project: { title: { $ifNull: ['$q.title', 'Deleted Quiz'] }, attempts: '$count', avgScore: { $round: ['$avgPct', 1] } } }
        ]),
        // Pass/fail uses each quiz's own passScore (a percentage). Attempts on deleted quizzes
        // have no pass mark: they count towards the average score but not the pass rate.
        Attempt.aggregate([
          { $match: { maxScore: { $gt: 0 } } },
          { $lookup: { from: 'quizzes', localField: 'quiz', foreignField: '_id', as: 'q' } },
          { $project: { pct: pctExpr, passScore: { $arrayElemAt: ['$q.passScore', 0] } } },
          { $project: {
            pct: 1,
            graded: { $cond: [{ $isNumber: '$passScore' }, 1, 0] },
            passed: { $cond: [{ $and: [{ $isNumber: '$passScore' }, { $gte: ['$pct', '$passScore'] }] }, 1, 0] }
          }},
          { $group: { _id: null, passCount: { $sum: '$passed' }, graded: { $sum: '$graded' }, total: { $sum: 1 }, avgScore: { $avg: '$pct' } } }
        ]),
        Review.countDocuments({ approved: false }),
      ]);

    const sd = scoreDistRaw[0] || {};
    const scoreDistribution = [
      { range: '0–20%',   count: sd.a?.[0]?.n || 0 },
      { range: '20–40%',  count: sd.b?.[0]?.n || 0 },
      { range: '40–60%',  count: sd.c?.[0]?.n || 0 },
      { range: '60–80%',  count: sd.d?.[0]?.n || 0 },
      { range: '80–100%', count: sd.e?.[0]?.n || 0 },
    ];

    const ps = passStats[0] || { passCount: 0, graded: 0, total: 0, avgScore: 0 };

    res.json({
      attemptsByDay:    attemptsByDay.map(d => ({ date: d._id, count: d.count })),
      usersByDay:       usersByDay.map(d => ({ date: d._id, count: d.count })),
      scoreDistribution,
      topQuizzes,
      pendingReviews,
      summary: {
        passRate:  ps.graded ? Math.round((ps.passCount / ps.graded) * 100) : 0,
        avgScore:  Math.round(ps.avgScore || 0),
        totalAttempts: ps.total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── CSV exports ───────────────────────────────────────────────────────────────
const isoDay = d => (d ? new Date(d).toISOString().split('T')[0] : '');

const sendCsv = (res, name, header, rows) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}-${isoDay(new Date())}.csv"`);
  res.send([header, ...rows].map(r => r.map(csvCell).join(',')).join('\n'));
};

exports.exportUsersCSV = async (req, res) => {
  try {
    const users = await User.find().select('name email role isActive createdAt').lean();
    sendCsv(res, 'users', ['Name', 'Email', 'Role', 'Active', 'Joined'],
      users.map(u => [u.name, u.email, u.role, u.isActive !== false ? 'Yes' : 'No', isoDay(u.createdAt)]));
  } catch { res.status(500).json({ message: 'Export failed' }); }
};

exports.exportAttemptsCSV = async (req, res) => {
  try {
    const attempts = await Attempt.find({ maxScore: { $gt: 0 } })
      .select('user quiz score maxScore completedAt createdAt')
      .populate('user', 'name email')
      .populate('quiz', 'title passScore')
      .lean();
    sendCsv(res, 'attempts', ['User', 'Email', 'Quiz', 'Score %', 'Pass mark %', 'Passed', 'Date'],
      attempts.map(a => {
        const pct = (a.score / a.maxScore) * 100;
        const passed = passedFor(pct, a.quiz?.passScore);
        return [
          a.user?.name ?? 'Deleted user', a.user?.email ?? '', a.quiz?.title ?? 'Deleted quiz',
          `${Math.round(pct)}%`, a.quiz ? `${a.quiz.passScore}%` : '',
          passed === null ? 'Unknown' : passed ? 'Yes' : 'No',
          isoDay(a.completedAt || a.createdAt)
        ];
      }));
  } catch { res.status(500).json({ message: 'Export failed' }); }
};
