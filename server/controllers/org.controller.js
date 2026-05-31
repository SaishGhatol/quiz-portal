const Organization   = require('../models/organization.model');
const Batch          = require('../models/batch.model');
const Assignment     = require('../models/assignment.model');
const Announcement   = require('../models/announcement.model');
const Attempt        = require('../models/attempt.model');
const User           = require('../models/user.model');
const Quiz           = require('../models/quiz.model');
const jwt            = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'examvault-secret-123';

const getOrgForUser = async userId => {
  const user = await User.findById(userId).select('orgId role');
  return user?.orgId ? Organization.findById(user.orgId) : null;
};

/** Re-issue JWT after role/orgId changes so the client doesn't need to re-login */
const freshToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '24h' });

const userPayload = (user) => ({
  id: user._id, name: user.name, email: user.email,
  role: user.role, orgId: user.orgId || null, batchIds: user.batchIds || [],
});

// ── ORGANISATION ─────────────────────────────────────────────────────────────

exports.createOrg = async (req, res) => {
  try {
    const { name, type, contactEmail, description, website, address, phone } = req.body;
    if (!name || !contactEmail)
      return res.status(400).json({ message: 'Name and contact email are required' });

    const existing = await User.findById(req.userId).select('orgId');
    if (existing?.orgId)
      return res.status(409).json({ message: 'You already belong to an organisation' });

    const org = await Organization.create({
      name, type: type || 'tuition', contactEmail, description, website, address, phone,
      createdBy:  req.userId,
      adminUsers: [req.userId]
    });

    // Update user role and orgId in DB
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { role: 'org_admin', orgId: org._id },
      { new: true }
    );

    // Return a FRESH JWT with the new role so org_admin routes work immediately
    res.status(201).json({ org, token: freshToken(updatedUser), user: userPayload(updatedUser) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Invite code collision — retry' });
    console.error('createOrg error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMyOrg = async (req, res) => {
  try {
    const org = await getOrgForUser(req.userId);
    if (!org) return res.status(404).json({ message: 'No organisation found' });

    const [studentCount, batchCount, quizCount] = await Promise.all([
      User.countDocuments({ orgId: org._id }),
      Batch.countDocuments({ organization: org._id, isActive: true }),
      Quiz.countDocuments({ createdBy: { $in: org.adminUsers } }),
    ]);

    res.json({ org, stats: { studentCount, batchCount, quizCount } });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updateOrg = async (req, res) => {
  try {
    const org = await getOrgForUser(req.userId);
    if (!org) return res.status(404).json({ message: 'Not found' });
    ['name','description','contactEmail','website','address','phone','logo','settings'].forEach(k => {
      if (req.body[k] !== undefined) org[k] = req.body[k];
    });
    await org.save();
    res.json({ org });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.joinOrg = async (req, res) => {
  try {
    const org = await Organization.findOne({
      inviteCode: (req.body.inviteCode || '').toUpperCase(),
      isActive:   true
    });
    if (!org) return res.status(404).json({ message: 'Invalid invite code' });

    // Check student limit
    const memberCount = await User.countDocuments({ orgId: org._id });
    if (memberCount >= org.limits.maxStudents)
      return res.status(403).json({ message: 'Organisation has reached its student limit' });

    const updatedUser = await User.findByIdAndUpdate(
      req.userId, { orgId: org._id }, { new: true }
    );

    res.json({ org: { _id: org._id, name: org.name }, token: freshToken(updatedUser), user: userPayload(updatedUser) });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.regenerateInviteCode = async (req, res) => {
  try {
    const crypto = require('crypto');
    const org    = await getOrgForUser(req.userId);
    if (!org) return res.status(404).json({ message: 'Not found' });
    org.inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    await org.save();
    res.json({ inviteCode: org.inviteCode });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ── BATCHES ───────────────────────────────────────────────────────────────────

exports.getBatches = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('orgId role batchIds');
    if (!user?.orgId) return res.json({ batches: [] });

    const isAdmin = user.role === 'org_admin' || user.role === 'admin';
    const query   = isAdmin
      ? { organization: user.orgId, isActive: true }
      : { _id: { $in: user.batchIds }, isActive: true };

    const batches  = await Batch.find(query).sort({ createdAt: -1 });
    const enriched = await Promise.all(batches.map(async b => ({
      ...b.toObject(),
      studentCount:    b.students.length,
      assignmentCount: await Assignment.countDocuments({ batch: b._id, isActive: true })
    })));
    res.json({ batches: enriched });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.createBatch = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('orgId');
    if (!user?.orgId) return res.status(403).json({ message: 'No organisation' });
    const { name, description, subject, academicYear, color } = req.body;
    const batch = await Batch.create({
      name, description, subject, academicYear,
      color: color || '#2563EB',
      organization: user.orgId,
      createdBy:    req.userId
    });
    res.status(201).json({ batch });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.getBatchById = async (req, res) => {
  try {
    const user  = await User.findById(req.userId).select('orgId role');
    const batch = await Batch.findById(req.params.id)
      .populate('students', 'name email createdAt lastLoginAt')
      .populate('createdBy', 'name');
    if (!batch) return res.status(404).json({ message: 'Not found' });
    if (user?.role !== 'admin' && batch.organization.toString() !== user?.orgId?.toString())
      return res.status(403).json({ message: 'Access denied' });

    const assignments = await Assignment.find({ batch: batch._id, isActive: true })
      .populate('quiz', 'title category difficulty timeLimit totalQuestions passScore')
      .sort({ createdAt: -1 });
    res.json({ batch, assignments });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.updateBatch = async (req, res) => {
  try {
    const user  = await User.findById(req.userId).select('orgId');
    const batch = await Batch.findOne({ _id: req.params.id, organization: user?.orgId });
    if (!batch) return res.status(404).json({ message: 'Not found' });
    ['name','description','subject','academicYear','color','isActive'].forEach(k => {
      if (req.body[k] !== undefined) batch[k] = req.body[k];
    });
    await batch.save();
    res.json({ batch });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.deleteBatch = async (req, res) => {
  try {
    const user  = await User.findById(req.userId).select('orgId');
    const batch = await Batch.findOneAndDelete({ _id: req.params.id, organization: user?.orgId });
    if (!batch) return res.status(404).json({ message: 'Not found' });
    await Assignment.deleteMany({ batch: req.params.id });
    await User.updateMany({ batchIds: req.params.id }, { $pull: { batchIds: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.addStudentToBatch = async (req, res) => {
  try {
    const user  = await User.findById(req.userId).select('orgId');
    const batch = await Batch.findOne({ _id: req.params.id, organization: user?.orgId });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    // Accept either a single studentId (from BatchDetail UI) or an emails[] array
    let toAdd    = [];
    let notFound = [];

    if (req.body.studentId) {
      // Single student by ID
      const student = await User.findById(req.body.studentId);
      if (!student) return res.status(404).json({ message: 'Student not found' });
      toAdd = [student];
    } else {
      // Array of emails
      const emails = (req.body.emails || []).map(e => e.toLowerCase().trim()).filter(Boolean);
      const users  = await User.find({ email: { $in: emails } });
      notFound     = emails.filter(e => !users.find(u => u.email === e));
      toAdd        = users;
    }

    const existing = batch.students.map(s => s.toString());
    const newOnes  = toAdd.filter(u => !existing.includes(u._id.toString()));

    if (newOnes.length) {
      batch.students.push(...newOnes.map(u => u._id));
      await batch.save();
      await Promise.all(newOnes.map(u =>
        User.findByIdAndUpdate(u._id, { orgId: user.orgId, $addToSet: { batchIds: batch._id } })
      ));
    }

    res.json({
      added:    newOnes.map(u => ({ _id: u._id, name: u.name, email: u.email })),
      notFound,
      message:  newOnes.length ? `${newOnes.length} student(s) added` : 'Already in batch'
    });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.removeStudentFromBatch = async (req, res) => {
  try {
    const user  = await User.findById(req.userId).select('orgId');
    const batch = await Batch.findOne({ _id: req.params.id, organization: user?.orgId });
    if (!batch) return res.status(404).json({ message: 'Not found' });
    batch.students = batch.students.filter(s => s.toString() !== req.params.studentId);
    await batch.save();
    await User.findByIdAndUpdate(req.params.studentId, { $pull: { batchIds: batch._id } });
    res.json({ message: 'Removed' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ── STUDENTS ──────────────────────────────────────────────────────────────────

exports.getOrgStudents = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('orgId');
    if (!user?.orgId) return res.json({ students: [] });

    const { search = '' } = req.query;
    const query = { orgId: user.orgId };
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await User.find(query)
      .select('name email role batchIds createdAt lastLoginAt')
      .sort({ name: 1 });

    // Attach batch names for display
    const batchMap = {};
    const allBatches = await Batch.find({ organization: user.orgId }).select('name');
    allBatches.forEach(b => { batchMap[b._id.toString()] = b.name; });

    const enriched = students.map(s => ({
      ...s.toObject(),
      batches: (s.batchIds || []).map(bid => ({ _id: bid, name: batchMap[bid.toString()] || '' }))
    }));

    res.json({ students: enriched });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.removeStudentFromOrg = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('orgId');
    await User.findByIdAndUpdate(req.params.studentId, { $unset: { orgId: 1 }, $set: { batchIds: [] } });
    await Batch.updateMany({ organization: user?.orgId }, { $pull: { students: req.params.studentId } });
    res.json({ message: 'Removed from organisation' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ── ASSIGNMENTS ───────────────────────────────────────────────────────────────

exports.createAssignment = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('orgId');
    if (!user?.orgId) return res.status(403).json({ message: 'No organisation' });
    const { quizId, batchId, title, instructions, startDate, dueDate, maxAttempts, passingScore } = req.body;

    const [batch, quiz] = await Promise.all([
      Batch.findOne({ _id: batchId, organization: user.orgId }),
      Quiz.findById(quizId)
    ]);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    if (!quiz)  return res.status(404).json({ message: 'Quiz not found' });

    const assignment = await Assignment.create({
      quiz: quizId, batch: batchId, organization: user.orgId, assignedBy: req.userId,
      title, instructions,
      startDate:    startDate  || new Date(),
      dueDate:      dueDate    || null,
      maxAttempts:  maxAttempts || 1,
      passingScore: passingScore || null
    });
    await assignment.populate('quiz',  'title category difficulty timeLimit');
    await assignment.populate('batch', 'name color');
    res.status(201).json({ assignment });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Already assigned to this batch' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const user  = await User.findById(req.userId).select('orgId role batchIds');
    const isAdm = user?.role === 'org_admin' || user?.role === 'admin';
    const query = isAdm
      ? { organization: user?.orgId, isActive: true }
      : { batch: { $in: user?.batchIds || [] }, isActive: true };
    if (req.query.batchId) query.batch = req.query.batchId;

    const assignments = await Assignment.find(query)
      .populate('quiz',  'title category difficulty timeLimit totalQuestions')
      .populate('batch', 'name color')
      .sort({ createdAt: -1 });
    res.json({ assignments });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('orgId');
    const asgn = await Assignment.findOneAndDelete({ _id: req.params.id, organization: user?.orgId });
    if (!asgn) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Removed' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.getMyAssignments = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('batchIds');
    if (!user?.batchIds?.length) return res.json({ assignments: [] });
    const now  = new Date();
    const list = await Assignment.find({
      batch: { $in: user.batchIds }, isActive: true,
      $or: [{ startDate: { $lte: now } }, { startDate: null }]
    })
      .populate('quiz',  'title category difficulty timeLimit totalQuestions passScore')
      .populate('batch', 'name color')
      .sort({ dueDate: 1, createdAt: -1 });

    const withStatus = await Promise.all(list.map(async asgn => {
      const count  = await Attempt.countDocuments({ user: req.userId, quiz: asgn.quiz, completedAt: { $ne: null } });
      const latest = await Attempt.findOne({ user: req.userId, quiz: asgn.quiz, completedAt: { $ne: null } })
        .sort({ completedAt: -1 }).select('score maxScore');
      const pct = latest?.maxScore > 0 ? Math.round((latest.score / latest.maxScore) * 100) : null;
      return {
        ...asgn.toObject(),
        attemptsUsed: count,
        attemptsLeft: Math.max(0, asgn.maxAttempts - count),
        canAttempt:   count < asgn.maxAttempts,
        lastScore:    pct,
        isOverdue:    asgn.dueDate && new Date(asgn.dueDate) < now && count === 0
      };
    }));
    res.json({ assignments: withStatus });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────

exports.getAnnouncements = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('orgId role batchIds');
    if (!user?.orgId) return res.json({ announcements: [] });

    const isAdm = ['org_admin','admin'].includes(user.role);
    const query = { orgId: user.orgId, isActive: true };

    // Students only see org-wide + their batch announcements
    if (!isAdm) {
      query.$or = [{ batchId: null }, { batchId: { $in: user.batchIds || [] } }];
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name')
      .populate('batchId',   'name')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json({ announcements });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('orgId');
    if (!user?.orgId) return res.status(403).json({ message: 'No organisation' });

    const { title, content, batchId, isPinned } = req.body;
    if (!title?.trim() || !content?.trim())
      return res.status(400).json({ message: 'Title and content are required' });

    const ann = await Announcement.create({
      orgId: user.orgId, title: title.trim(), content: content.trim(),
      batchId:   batchId || null,
      isPinned:  !!isPinned,
      createdBy: req.userId,
    });
    const populated = await ann.populate('createdBy', 'name');
    res.status(201).json({ announcement: populated });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('orgId');
    const ann  = await Announcement.findOneAndDelete({ _id: req.params.id, orgId: user?.orgId });
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};

// ── ANALYTICS ─────────────────────────────────────────────────────────────────

exports.getOrgAnalytics = async (req, res) => {
  try {
    const user  = await User.findById(req.userId).select('orgId');
    const orgId = user?.orgId;
    if (!orgId) return res.status(403).json({ message: 'No organisation' });

    const [batches, studentCount, assignments] = await Promise.all([
      Batch.find({ organization: orgId, isActive: true }),
      User.countDocuments({ orgId }),
      Assignment.find({ organization: orgId, isActive: true }).populate('quiz','title').populate('batch','name color')
    ]);

    const allStudentIds = (await User.find({ orgId }).select('_id')).map(u => u._id);

    // Attempts summary
    const attemptSummary = await Attempt.aggregate([
      { $match: { user: { $in: allStudentIds }, completedAt: { $ne: null } } },
      { $group: {
        _id:       null,
        total:     { $sum: 1 },
        avgScore:  { $avg: { $multiply: [{ $divide: ['$score','$maxScore'] }, 100] } },
        passed:    { $sum: { $cond: [{ $gte: [{ $divide: ['$score','$maxScore'] }, 0.4] }, 1, 0] } }
      }}
    ]);
    const sm = attemptSummary[0] || { total: 0, avgScore: 0, passed: 0 };

    // Batch performance stats
    const batchStats = await Promise.all(batches.map(async b => {
      const bStudIds = b.students;
      const agg = await Attempt.aggregate([
        { $match: { user: { $in: bStudIds }, completedAt: { $ne: null } } },
        { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: { $multiply: [{ $divide: ['$score','$maxScore'] }, 100] } } } }
      ]);
      return {
        batchId: b._id, name: b.name, color: b.color,
        studentCount:  bStudIds.length,
        attemptCount:  agg[0]?.count   || 0,
        avgScore:      Math.round(agg[0]?.avg || 0)
      };
    }));

    // Recent activity (last 15 completions across the org)
    const recentAttempts = await Attempt.find({ user: { $in: allStudentIds }, completedAt: { $ne: null } })
      .populate('user','name').populate('quiz','title')
      .sort({ completedAt: -1 }).limit(15);

    const recentActivity = recentAttempts.map(a => ({
      studentName: a.user?.name,
      quizTitle:   a.quiz?.title,
      score:       a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0,
      completedAt: a.completedAt
    }));

    res.json({
      overview: {
        students:      studentCount,
        batches:       batches.length,
        assignments:   assignments.length,
        totalAttempts: sm.total,
        avgScore:      Math.round(sm.avgScore),
        passRate:      sm.total > 0 ? Math.round((sm.passed / sm.total) * 100) : 0,
      },
      batchStats,
      recentActivity
    });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
};
