const Organization   = require('../models/organization.model');
const Batch          = require('../models/batch.model');
const Assignment     = require('../models/assignment.model');
const Announcement   = require('../models/announcement.model');
const Attempt        = require('../models/attempt.model');
const User           = require('../models/user.model');
const Quiz           = require('../models/quiz.model');
const Question       = require('../models/question.model');
const jwt            = require('jsonwebtoken');
const { PLANS, withinLimit } = require('../config/plans');
const { escapeRegex }        = require('../utils/quizAccess');
const { isObjectId }         = require('../middleware/objectId.middleware');

// Same source as the verifying middleware, so signed tokens always validate
const { JWT_SECRET: SECRET } = require('../config/config');

const isAdminRole = role => role === 'org_admin' || role === 'admin';

// Students are plain members; org admins share orgId but never count as students
const STUDENT_ROLE = 'user';

/** The caller's own user record (orgId, role, batch membership) */
const getCaller = userId => User.findById(userId).select('name email orgId role batchIds');

const getOrgForUser = async userId => {
  const user = await User.findById(userId).select('orgId role');
  return user?.orgId ? Organization.findById(user.orgId) : null;
};

/** Limits always come from the plan config, never from the stale per-org snapshot */
const planLimits = org => (PLANS[org?.plan] || PLANS.free).limits;

/** Re-issue JWT after role/orgId changes so the client doesn't need to re-login */
const freshToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '24h' });

const userPayload = (user) => ({
  id: user._id, name: user.name, email: user.email,
  role: user.role, orgId: user.orgId || null, batchIds: user.batchIds || [],
});

/** Mongoose validation/cast errors are the caller's fault (400); everything else is ours (500) */
const sendError = (res, err, label = 'org') => {
  if (err?.name === 'ValidationError')
    return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join('. ') });
  if (err?.name === 'CastError')
    return res.status(400).json({ message: `Invalid ${err.path || 'value'}` });
  if (err?.code === 11000)
    return res.status(409).json({ message: 'A record with that value already exists' });
  console.error(`${label} error:`, err);
  res.status(500).json({ message: 'Server error' });
};

const isPlainObject = v => !!v && typeof v === 'object' && !Array.isArray(v);
const optString = (v, max) => v === undefined || v === null || (typeof v === 'string' && v.length <= max);

/** Ids of the org's active batches, optionally limited to `ids` */
const activeBatchIds = async (orgId, ids) => {
  const query = { organization: orgId, isActive: true };
  if (ids) query._id = { $in: ids };
  return (await Batch.find(query).select('_id')).map(b => b._id);
};

/**
 * Quizzes whose attempts count toward this org's numbers: the org's own quizzes plus
 * platform quizzes it has assigned to an active batch.
 */
const orgQuizIds = async orgId => {
  const batchIds = await activeBatchIds(orgId);
  const [own, assigned] = await Promise.all([
    Quiz.find({ organization: orgId }).distinct('_id'),
    Assignment.find({ organization: orgId, isActive: true, batch: { $in: batchIds } }).distinct('quiz'),
  ]);
  const seen = new Map();
  [...own, ...assigned].forEach(id => seen.set(String(id), id));
  return [...seen.values()];
};

const percent = a => (a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0);

/** Retries `save` when a freshly generated unique code collides with an existing one */
const withCodeRetry = async (fn, tries = 5) => {
  for (let i = 1; ; i++) {
    try { return await fn(); }
    catch (err) {
      if (err?.code !== 11000 || i >= tries) throw err;
    }
  }
};

// ── ORGANISATION ─────────────────────────────────────────────────────────────

exports.createOrg = async (req, res) => {
  try {
    const { name, type, contactEmail, description, website, address, phone } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof contactEmail !== 'string' || !contactEmail.trim())
      return res.status(400).json({ message: 'Name and contact email are required' });
    if (![description, website, address, phone].every(v => optString(v, 2000)))
      return res.status(400).json({ message: 'Description, website, address and phone must be text' });

    const existing = await User.findById(req.userId).select('orgId role');
    if (existing?.orgId)
      return res.status(409).json({ message: 'You already belong to an organisation' });

    const org = await withCodeRetry(() => Organization.create({
      name: name.trim(), type: type || 'tuition', contactEmail: contactEmail.trim(),
      description, website, address, phone,
      inviteCode: Organization.makeInviteCode(),
      createdBy:  req.userId,
      adminUsers: [req.userId]
    }));

    // Platform admins keep their role; everyone else becomes this org's admin
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { role: existing?.role === 'admin' ? 'admin' : 'org_admin', orgId: org._id, batchIds: [] },
      { new: true }
    );

    // Return a FRESH JWT with the new role so org_admin routes work immediately
    res.status(201).json({ org, token: freshToken(updatedUser), user: userPayload(updatedUser) });
  } catch (err) { sendError(res, err, 'createOrg'); }
};

exports.getMyOrg = async (req, res) => {
  try {
    const caller = await getCaller(req.userId);
    const org    = caller?.orgId ? await Organization.findById(caller.orgId) : null;
    if (!org) return res.status(404).json({ message: 'No organisation found' });

    const [studentCount, batchCount, quizCount] = await Promise.all([
      User.countDocuments({ orgId: org._id, role: STUDENT_ROLE }),
      Batch.countDocuments({ organization: org._id, isActive: true }),
      Quiz.countDocuments({ organization: org._id }),
    ]);

    const out = org.toObject();
    out.limits = { ...planLimits(org) };
    // The invite code lets anyone join — only the org's admins get to see it
    if (!isAdminRole(caller.role)) delete out.inviteCode;

    res.json({ org: out, stats: { studentCount, batchCount, quizCount } });
  } catch (err) { sendError(res, err, 'getMyOrg'); }
};

exports.updateOrg = async (req, res) => {
  try {
    const org = await getOrgForUser(req.userId);
    if (!org) return res.status(404).json({ message: 'Not found' });
    const body = req.body || {};

    for (const k of ['name', 'contactEmail']) {
      if (body[k] !== undefined && (typeof body[k] !== 'string' || !body[k].trim()))
        return res.status(400).json({ message: `${k === 'name' ? 'Name' : 'Contact email'} can't be empty` });
    }
    for (const k of ['description', 'website', 'address', 'phone', 'logo']) {
      if (!optString(body[k], 2000)) return res.status(400).json({ message: `${k} must be text` });
    }
    if (body.settings !== undefined) {
      const s = body.settings;
      if (!isPlainObject(s)) return res.status(400).json({ message: 'settings must be an object' });
      for (const k of ['allowSelfEnroll', 'showLeaderboard']) {
        if (s[k] !== undefined && typeof s[k] !== 'boolean')
          return res.status(400).json({ message: `settings.${k} must be true or false` });
      }
      if (s.brandColor !== undefined && (typeof s.brandColor !== 'string' || !/^#[0-9a-fA-F]{3,8}$/.test(s.brandColor)))
        return res.status(400).json({ message: 'settings.brandColor must be a hex colour like #4f46e5' });
    }

    ['name', 'description', 'contactEmail', 'website', 'address', 'phone', 'logo'].forEach(k => {
      if (body[k] !== undefined && body[k] !== null) org[k] = typeof body[k] === 'string' ? body[k].trim() : body[k];
    });
    // Merge known settings instead of replacing the whole object
    if (body.settings) {
      ['allowSelfEnroll', 'showLeaderboard', 'brandColor'].forEach(k => {
        if (body.settings[k] !== undefined) org.settings[k] = body.settings[k];
      });
    }
    await org.save();
    res.json({ org });
  } catch (err) { sendError(res, err, 'updateOrg'); }
};

exports.joinOrg = async (req, res) => {
  try {
    const raw = req.body?.inviteCode;
    if (typeof raw !== 'string' || !raw.trim())
      return res.status(400).json({ message: 'Enter the invite code your teacher shared' });
    const code = raw.replace(/[\s-]/g, '').toUpperCase();
    if (!/^[A-Z0-9]{4,12}$/.test(code))
      return res.status(400).json({ message: 'Invite codes contain only letters and numbers' });

    const caller = await getCaller(req.userId);
    if (!caller) return res.status(401).json({ message: 'Account no longer exists' });

    const org = await Organization.findOne({ inviteCode: code, isActive: true });
    if (!org) return res.status(404).json({ message: 'Invalid invite code' });

    // Already a member of this very org: nothing to do
    if (caller.orgId && String(caller.orgId) === String(org._id))
      return res.json({ alreadyMember: true, org: { _id: org._id, name: org.name }, token: freshToken(caller), user: userPayload(caller) });

    // Invite codes are for students only — admins and teachers can't use one to take over another org
    if (caller.role !== STUDENT_ROLE)
      return res.status(403).json({ message: 'Only student accounts can join an organisation with an invite code' });

    if (caller.orgId) {
      const current = await Organization.findById(caller.orgId).select('name');
      return res.status(409).json({ message: `You're already in ${current?.name || 'another organisation'} — leave it first` });
    }

    if (org.settings?.allowSelfEnroll === false)
      return res.status(403).json({ message: `${org.name} isn't accepting new members with an invite code right now. Ask your admin to add you.` });

    const { maxStudents } = planLimits(org);
    const memberCount = await User.countDocuments({ orgId: org._id, role: STUDENT_ROLE });
    if (!withinLimit(memberCount, maxStudents))
      return res.status(403).json({ message: `${org.name} has reached its ${org.plan} plan student limit. Ask the admin to upgrade.` });

    // A new member starts with no batches; the org's admin assigns them
    const updatedUser = await User.findByIdAndUpdate(
      req.userId, { orgId: org._id, batchIds: [] }, { new: true }
    );

    res.json({ org: { _id: org._id, name: org.name }, token: freshToken(updatedUser), user: userPayload(updatedUser) });
  } catch (err) { sendError(res, err, 'joinOrg'); }
};

exports.regenerateInviteCode = async (req, res) => {
  try {
    const org = await getOrgForUser(req.userId);
    if (!org) return res.status(404).json({ message: 'Not found' });
    await withCodeRetry(() => {
      org.inviteCode = Organization.makeInviteCode();
      return org.save();
    });
    res.json({ inviteCode: org.inviteCode });
  } catch (err) { sendError(res, err, 'regenerateInviteCode'); }
};

// ── BATCHES ───────────────────────────────────────────────────────────────────

const BATCH_FIELDS = ['name', 'description', 'subject', 'academicYear', 'color'];

/** Returns an error message for bad batch input, or null */
const batchInputError = (body, creating) => {
  if (creating || body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) return 'Batch name is required';
    if (body.name.length > 100) return 'Batch name must be 100 characters or fewer';
  }
  for (const k of ['description', 'subject', 'academicYear', 'color']) {
    if (!optString(body[k], 1000)) return `${k} must be text`;
  }
  if (body.isActive !== undefined && typeof body.isActive !== 'boolean') return 'isActive must be true or false';
  return null;
};

exports.getBatches = async (req, res) => {
  try {
    const user = await getCaller(req.userId);
    if (!user?.orgId) return res.json({ batches: [] });

    const isAdmin = isAdminRole(user.role);
    const query   = isAdmin
      ? { organization: user.orgId, isActive: true }
      : { _id: { $in: user.batchIds || [] }, organization: user.orgId, isActive: true };
    // Admins can ask for deactivated batches too (so they can be reactivated)
    if (isAdmin && req.query.includeInactive === '1') delete query.isActive;

    const batches  = await Batch.find(query).sort({ createdAt: -1 });
    const enriched = await Promise.all(batches.map(async b => {
      const obj = b.toObject();
      // Students don't get the roster or the join code
      if (!isAdmin) { delete obj.students; delete obj.joinCode; }
      return {
        ...obj,
        studentCount:    b.students.length,
        assignmentCount: await Assignment.countDocuments({ batch: b._id, isActive: true })
      };
    }));
    res.json({ batches: enriched });
  } catch (err) { sendError(res, err, 'getBatches'); }
};

exports.createBatch = async (req, res) => {
  try {
    const user = await getCaller(req.userId);
    if (!user?.orgId) return res.status(403).json({ message: 'No organisation' });

    const body  = req.body || {};
    const error = batchInputError(body, true);
    if (error) return res.status(400).json({ message: error });

    const org = await Organization.findById(user.orgId);
    if (!org) return res.status(404).json({ message: 'Organisation not found' });
    const { maxBatches } = planLimits(org);
    const batchCount = await Batch.countDocuments({ organization: org._id, isActive: true });
    if (!withinLimit(batchCount, maxBatches))
      return res.status(403).json({ message: `Your ${org.plan} plan allows up to ${maxBatches} batches. Upgrade your plan to create more.` });

    const { name, description, subject, academicYear, color } = body;
    const batch = await withCodeRetry(() => Batch.create({
      name: name.trim(), description, subject, academicYear,
      color: color || '#2563EB',
      organization: user.orgId,
      createdBy:    req.userId
    }));
    res.status(201).json({ batch });
  } catch (err) { sendError(res, err, 'createBatch'); }
};

exports.getBatchById = async (req, res) => {
  try {
    const user    = await getCaller(req.userId);
    const isAdmin = isAdminRole(user?.role);
    const batch   = await Batch.findById(req.params.id)
      // Admins see the roster with contact details; classmates only see names
      .populate('students', isAdmin ? 'name email createdAt lastLoginAt' : 'name')
      .populate('createdBy', 'name');
    if (!batch) return res.status(404).json({ message: 'Not found' });
    if (user?.role !== 'admin' && String(batch.organization) !== String(user?.orgId))
      return res.status(403).json({ message: 'Access denied' });
    if (!isAdmin) {
      const member = (user.batchIds || []).some(id => String(id) === String(batch._id));
      if (!member || !batch.isActive) return res.status(403).json({ message: 'You are not in this batch' });
    }

    const assignments = await Assignment.find({ batch: batch._id, isActive: true })
      .populate('quiz', 'title category difficulty timeLimit totalQuestions passScore')
      .sort({ createdAt: -1 });

    const out = batch.toObject();
    if (!isAdmin) delete out.joinCode;
    res.json({ batch: out, assignments });
  } catch (err) { sendError(res, err, 'getBatchById'); }
};

exports.updateBatch = async (req, res) => {
  try {
    const user  = await getCaller(req.userId);
    const batch = await Batch.findOne({ _id: req.params.id, organization: user?.orgId });
    if (!batch) return res.status(404).json({ message: 'Not found' });

    const body  = req.body || {};
    const error = batchInputError(body, false);
    if (error) return res.status(400).json({ message: error });

    // Reactivating counts against the plan's batch limit again
    if (body.isActive === true && !batch.isActive) {
      const org = await Organization.findById(user.orgId);
      const { maxBatches } = planLimits(org);
      const batchCount = await Batch.countDocuments({ organization: user.orgId, isActive: true });
      if (!withinLimit(batchCount, maxBatches))
        return res.status(403).json({ message: `Your ${org.plan} plan allows up to ${maxBatches} active batches. Upgrade your plan to reactivate this one.` });
    }

    [...BATCH_FIELDS, 'isActive'].forEach(k => {
      if (body[k] !== undefined && body[k] !== null) batch[k] = typeof body[k] === 'string' ? body[k].trim() : body[k];
    });
    await batch.save();
    res.json({ batch });
  } catch (err) { sendError(res, err, 'updateBatch'); }
};

exports.deleteBatch = async (req, res) => {
  try {
    const user  = await getCaller(req.userId);
    const batch = await Batch.findOneAndDelete({ _id: req.params.id, organization: user?.orgId });
    if (!batch) return res.status(404).json({ message: 'Not found' });
    // Everything that only made sense for this batch goes with it
    await Promise.all([
      Assignment.deleteMany({ batch: batch._id }),
      Announcement.deleteMany({ batchId: batch._id }),
      User.updateMany({ batchIds: batch._id }, { $pull: { batchIds: batch._id } }),
    ]);
    res.json({ message: 'Deleted' });
  } catch (err) { sendError(res, err, 'deleteBatch'); }
};

exports.addStudentToBatch = async (req, res) => {
  try {
    const user  = await getCaller(req.userId);
    const batch = await Batch.findOne({ _id: req.params.id, organization: user?.orgId });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    // Accept either a single studentId (from BatchDetail UI) or an emails[] array.
    // Only existing students of THIS organisation can be added — nobody is moved between orgs here.
    let toAdd   = [];
    const skipped = [];   // [{ email, reason }]

    if (req.body.studentId !== undefined) {
      if (!isObjectId(req.body.studentId)) return res.status(400).json({ message: 'Invalid student' });
      const student = await User.findById(req.body.studentId).select('name email role orgId');
      if (!student || String(student.orgId) !== String(user.orgId))
        return res.status(404).json({ message: 'Student not found in your organisation' });
      if (student.role !== STUDENT_ROLE)
        return res.status(400).json({ message: `${student.name} is an admin, not a student` });
      toAdd = [student];
    } else {
      if (!Array.isArray(req.body.emails) || !req.body.emails.length)
        return res.status(400).json({ message: 'Provide a studentId or a list of emails' });
      if (req.body.emails.length > 500)
        return res.status(400).json({ message: 'Add at most 500 students at a time' });
      const emails = [...new Set(req.body.emails
        .filter(e => typeof e === 'string')
        .map(e => e.toLowerCase().trim())
        .filter(Boolean))];
      const users = await User.find({ email: { $in: emails } }).select('name email role orgId');
      for (const email of emails) {
        const u = users.find(x => x.email === email);
        if (!u)                                         skipped.push({ email, reason: 'not found' });
        else if (String(u.orgId) !== String(user.orgId)) skipped.push({ email, reason: 'not in your organisation' });
        else if (u.role !== STUDENT_ROLE)               skipped.push({ email, reason: 'is an admin' });
        else                                            toAdd.push(u);
      }
    }

    const existing = batch.students.map(s => s.toString());
    const newOnes  = toAdd.filter(u => !existing.includes(u._id.toString()));

    if (newOnes.length) {
      await Batch.updateOne({ _id: batch._id }, { $addToSet: { students: { $each: newOnes.map(u => u._id) } } });
      await User.updateMany(
        { _id: { $in: newOnes.map(u => u._id) }, orgId: user.orgId },
        { $addToSet: { batchIds: batch._id } }
      );
    }

    res.json({
      added:    newOnes.map(u => ({ _id: u._id, name: u.name, email: u.email })),
      skipped,
      // Kept for older clients: emails that couldn't be added for any reason
      notFound: skipped.map(s => s.email),
      message:  newOnes.length ? `${newOnes.length} student(s) added`
        : toAdd.length ? 'Already in batch' : 'No students were added'
    });
  } catch (err) { sendError(res, err, 'addStudentToBatch'); }
};

exports.removeStudentFromBatch = async (req, res) => {
  try {
    const user  = await getCaller(req.userId);
    const batch = await Batch.findOne({ _id: req.params.id, organization: user?.orgId });
    if (!batch) return res.status(404).json({ message: 'Not found' });
    await Batch.updateOne({ _id: batch._id }, { $pull: { students: req.params.studentId } });
    await User.updateOne({ _id: req.params.studentId, orgId: user.orgId }, { $pull: { batchIds: batch._id } });
    res.json({ message: 'Removed' });
  } catch (err) { sendError(res, err, 'removeStudentFromBatch'); }
};

// ── STUDENTS ──────────────────────────────────────────────────────────────────

exports.getOrgStudents = async (req, res) => {
  try {
    const user = await getCaller(req.userId);
    if (!user?.orgId) return res.json({ students: [] });

    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const query  = { orgId: user.orgId, role: STUDENT_ROLE };
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: 'i' };
      query.$or = [{ name: rx }, { email: rx }];
    }

    const students = await User.find(query)
      .select('name email role batchIds createdAt lastLoginAt')
      .sort({ name: 1 });

    // Attach (active) batch names for display
    const batchMap = {};
    const allBatches = await Batch.find({ organization: user.orgId, isActive: true }).select('name');
    allBatches.forEach(b => { batchMap[b._id.toString()] = b.name; });

    // Completed attempts on this org's quizzes (own + assigned), per student
    const quizIds = await orgQuizIds(user.orgId);
    const counts  = await Attempt.aggregate([
      { $match: { user: { $in: students.map(s => s._id) }, quiz: { $in: quizIds }, completedAt: { $ne: null } } },
      { $group: { _id: '$user', n: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map(c => [String(c._id), c.n]));

    const enriched = students.map(s => ({
      ...s.toObject(),
      batches: (s.batchIds || [])
        .filter(bid => batchMap[bid.toString()])
        .map(bid => ({ _id: bid, name: batchMap[bid.toString()] })),
      attemptCount: countMap[String(s._id)] || 0,
    }));

    res.json({ students: enriched });
  } catch (err) { sendError(res, err, 'getOrgStudents'); }
};

exports.removeStudentFromOrg = async (req, res) => {
  try {
    const user = await getCaller(req.userId);
    if (!user?.orgId) return res.status(403).json({ message: 'No organisation' });
    if (String(req.params.studentId) === String(user._id))
      return res.status(400).json({ message: "You can't remove yourself from your organisation" });

    const student = await User.findOne({ _id: req.params.studentId, orgId: user.orgId }).select('role name');
    if (!student) return res.status(404).json({ message: 'Student not found in your organisation' });
    if (student.role !== STUDENT_ROLE)
      return res.status(403).json({ message: 'Admins can’t be removed from here' });

    await User.updateOne({ _id: student._id, orgId: user.orgId, role: STUDENT_ROLE }, { $set: { orgId: null, batchIds: [] } });
    await Batch.updateMany({ organization: user.orgId }, { $pull: { students: student._id } });
    res.json({ message: 'Removed from organisation' });
  } catch (err) { sendError(res, err, 'removeStudentFromOrg'); }
};

// ── ASSIGNMENTS ───────────────────────────────────────────────────────────────

const INVALID = Symbol('invalid');

/** undefined → not sent; null/'' → cleared; otherwise a valid Date or INVALID */
const parseDate = v => {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (typeof v !== 'string' && typeof v !== 'number') return INVALID;
  const d = new Date(v);
  return isNaN(d.getTime()) ? INVALID : d;
};

/**
 * Validates the editable assignment fields. `current` is the stored assignment when editing.
 * Returns { fields } with only what was sent, or { error }.
 */
const readAssignmentFields = (body, current) => {
  const now    = new Date();
  const fields = {};

  const startDate = parseDate(body.startDate);
  const dueDate   = parseDate(body.dueDate);
  if (startDate === INVALID) return { error: 'Start date is not a valid date' };
  if (dueDate === INVALID)   return { error: 'Due date is not a valid date' };

  if (startDate !== undefined) {
    // Clearing the start date means "open now" (an already-open assignment keeps its date)
    fields.startDate = startDate || (current?.startDate && current.startDate <= now ? current.startDate : now);
  } else if (!current) fields.startDate = now;
  if (dueDate !== undefined) fields.dueDate = dueDate;

  const start = fields.startDate || current?.startDate || now;
  const due   = fields.dueDate !== undefined ? fields.dueDate : current?.dueDate;
  const dueChanged = fields.dueDate && (!current?.dueDate || fields.dueDate.getTime() !== current.dueDate.getTime());
  if (dueChanged && fields.dueDate < now) return { error: 'Due date is in the past' };
  if (due && due <= start) return { error: 'Due date must be after the start date' };

  if (body.maxAttempts !== undefined && body.maxAttempts !== null && body.maxAttempts !== '') {
    const n = Number(body.maxAttempts);
    if (!Number.isInteger(n) || n < 1 || n > 10) return { error: 'Max attempts must be a whole number from 1 to 10' };
    fields.maxAttempts = n;
  } else if (!current) fields.maxAttempts = 1;

  if (body.passingScore !== undefined) {
    if (body.passingScore === null || body.passingScore === '') fields.passingScore = null;
    else {
      const n = Number(body.passingScore);
      if (!Number.isFinite(n) || n < 0 || n > 100) return { error: 'Passing score must be between 0 and 100' };
      fields.passingScore = n;
    }
  }

  for (const [k, max] of [['instructions', 2000], ['title', 200]]) {
    if (body[k] === undefined) continue;
    if (body[k] !== null && typeof body[k] !== 'string') return { error: `${k} must be text` };
    if ((body[k] || '').length > max) return { error: `${k[0].toUpperCase()}${k.slice(1)} must be ${max} characters or fewer` };
    fields[k] = (body[k] || '').trim();
  }
  return { fields };
};

const populateAssignment = async asgn => {
  await asgn.populate('quiz',  'title category difficulty timeLimit totalQuestions passScore');
  await asgn.populate('batch', 'name color');
  return asgn;
};

exports.createAssignment = async (req, res) => {
  try {
    const user = await getCaller(req.userId);
    if (!user?.orgId) return res.status(403).json({ message: 'No organisation' });
    const { quizId, batchId } = req.body || {};
    if (!quizId)  return res.status(400).json({ message: 'Choose a quiz to assign' });
    if (!batchId) return res.status(400).json({ message: 'Choose a batch' });
    if (typeof quizId !== 'string' || !isObjectId(quizId))   return res.status(400).json({ message: 'Invalid quiz' });
    if (typeof batchId !== 'string' || !isObjectId(batchId)) return res.status(400).json({ message: 'Invalid batch' });

    const { fields, error } = readAssignmentFields(req.body);
    if (error) return res.status(400).json({ message: error });

    const [batch, quiz] = await Promise.all([
      Batch.findOne({ _id: batchId, organization: user.orgId, isActive: true }),
      // Your own organisation's quizzes, or published platform quizzes — never another org's
      Quiz.findOne({ _id: quizId, $or: [{ organization: user.orgId }, { organization: null, isPublished: true }] })
    ]);
    if (!batch) return res.status(404).json({ message: 'Batch not found in your organisation' });
    if (!quiz)  return res.status(404).json({ message: 'Quiz not found. You can assign your organisation\'s quizzes or published platform quizzes.' });

    const questionCount = await Question.countDocuments({ quizId: quiz._id });
    if (!questionCount) return res.status(400).json({ message: 'This quiz has no questions yet — add some before assigning it' });

    const assignment = await Assignment.create({
      ...fields,
      quiz: quiz._id, batch: batch._id, organization: user.orgId, assignedBy: req.userId,
    });
    await populateAssignment(assignment);
    res.status(201).json({ assignment });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'This quiz is already assigned to this batch' });
    sendError(res, err, 'createAssignment');
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const user = await getCaller(req.userId);
    if (!user?.orgId) return res.status(403).json({ message: 'No organisation' });
    const asgn = await Assignment.findOne({ _id: req.params.id, organization: user.orgId });
    if (!asgn) return res.status(404).json({ message: 'Assignment not found' });

    // The quiz and batch are fixed — remove and re-assign to change them
    const { fields, error } = readAssignmentFields(req.body || {}, asgn);
    if (error) return res.status(400).json({ message: error });

    Object.assign(asgn, fields);
    await asgn.save();
    await populateAssignment(asgn);
    res.json({ assignment: asgn });
  } catch (err) { sendError(res, err, 'updateAssignment'); }
};

exports.getAssignments = async (req, res) => {
  try {
    const user = await getCaller(req.userId);
    if (!user?.orgId) return res.json({ assignments: [] });
    const isAdm = isAdminRole(user.role);

    // Admins: every active batch in the org. Students: only their own active batches.
    let batchIds = await activeBatchIds(user.orgId, isAdm ? undefined : (user.batchIds || []));

    if (req.query.batchId !== undefined) {
      const wanted = req.query.batchId;
      if (typeof wanted !== 'string' || !isObjectId(wanted)) return res.status(400).json({ message: 'Invalid batch' });
      if (!batchIds.some(id => String(id) === wanted))
        return isAdm
          ? res.status(404).json({ message: 'Batch not found' })
          : res.status(403).json({ message: 'You are not in this batch' });
      batchIds = batchIds.filter(id => String(id) === wanted);
    }

    const assignments = await Assignment.find({ organization: user.orgId, batch: { $in: batchIds }, isActive: true })
      .populate('quiz',  'title category difficulty timeLimit totalQuestions passScore')
      .populate('batch', 'name color')
      .sort({ createdAt: -1 });
    res.json({ assignments });
  } catch (err) { sendError(res, err, 'getAssignments'); }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const user = await getCaller(req.userId);
    const asgn = await Assignment.findOneAndDelete({ _id: req.params.id, organization: user?.orgId });
    if (!asgn) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Removed' });
  } catch (err) { sendError(res, err, 'deleteAssignment'); }
};

exports.getMyAssignments = async (req, res) => {
  try {
    const user = await getCaller(req.userId);
    if (!user?.orgId || !user.batchIds?.length) return res.json({ assignments: [] });

    // Only the user's current org and its active batches
    const batchIds = await activeBatchIds(user.orgId, user.batchIds);
    if (!batchIds.length) return res.json({ assignments: [] });

    const now  = new Date();
    const list = await Assignment.find({ organization: user.orgId, batch: { $in: batchIds }, isActive: true })
      .populate('quiz',  'title category difficulty timeLimit totalQuestions passScore')
      .populate('batch', 'name color')
      .sort({ dueDate: 1, createdAt: -1 });

    const withStatus = await Promise.all(list.filter(a => a.quiz).map(async asgn => {
      const start    = asgn.startDate || asgn.createdAt;
      const upcoming = start > now;
      const pastDue  = !!asgn.dueDate && asgn.dueDate < now;

      // Only attempts made inside the assignment window count toward it
      let attempts = [];
      if (!upcoming) {
        const inWindow = { $gte: start };
        if (asgn.dueDate) inWindow.$lte = asgn.dueDate;
        attempts = await Attempt.find({ user: user._id, quiz: asgn.quiz._id, completedAt: inWindow })
          .sort({ completedAt: -1 }).select('score maxScore completedAt');
      }

      const used      = attempts.length;
      const scores    = attempts.map(percent);
      const bestScore = used ? Math.max(...scores) : null;
      const passMark  = asgn.passingScore ?? asgn.quiz.passScore ?? null;
      const status    = upcoming ? 'upcoming'
        : used >= asgn.maxAttempts || (pastDue && used > 0) ? 'completed'
        : pastDue ? 'expired'
        : 'active';

      return {
        ...asgn.toObject(),
        status,                                  // upcoming | active | completed | expired
        isUpcoming:   upcoming,
        attemptsUsed: used,
        attemptsLeft: Math.max(0, asgn.maxAttempts - used),
        canAttempt:   !upcoming && !pastDue && used < asgn.maxAttempts,
        lastScore:    used ? scores[0] : null,
        bestScore,
        passed:       bestScore != null && passMark != null ? bestScore >= passMark : null,
        lastAttemptAt: attempts[0]?.completedAt || null,
        // Deadline passed with attempts still unused
        isOverdue:    pastDue && used < asgn.maxAttempts
      };
    }));
    res.json({ assignments: withStatus });
  } catch (err) { sendError(res, err, 'getMyAssignments'); }
};

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────

exports.getAnnouncements = async (req, res) => {
  try {
    const user = await getCaller(req.userId);
    if (!user?.orgId) return res.json({ announcements: [] });

    const isAdm = isAdminRole(user.role);
    const query = { orgId: user.orgId, isActive: true };

    // Students only see org-wide + their (active) batch announcements
    if (!isAdm) {
      const mine = await activeBatchIds(user.orgId, user.batchIds || []);
      query.$or = [{ batchId: null }, { batchId: { $in: mine } }];
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name')
      .populate('batchId',   'name')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json({ announcements });
  } catch (err) { sendError(res, err, 'getAnnouncements'); }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const user = await getCaller(req.userId);
    if (!user?.orgId) return res.status(403).json({ message: 'No organisation' });

    const { title, content, batchId, isPinned } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim())
      return res.status(400).json({ message: 'Title and content are required' });
    if (title.length > 200)    return res.status(400).json({ message: 'Title must be 200 characters or fewer' });
    if (content.length > 5000) return res.status(400).json({ message: 'Content must be 5000 characters or fewer' });

    // A batch announcement must target one of this org's active batches
    if (batchId) {
      if (typeof batchId !== 'string' || !isObjectId(batchId)) return res.status(400).json({ message: 'Invalid batch' });
      const batch = await Batch.exists({ _id: batchId, organization: user.orgId, isActive: true });
      if (!batch) return res.status(404).json({ message: 'Batch not found in your organisation' });
    }

    const ann = await Announcement.create({
      orgId: user.orgId, title: title.trim(), content: content.trim(),
      batchId:   batchId || null,
      isPinned:  isPinned === true,
      createdBy: req.userId,
    });
    await ann.populate('createdBy', 'name');
    await ann.populate('batchId', 'name');
    res.status(201).json({ announcement: ann });
  } catch (err) { sendError(res, err, 'createAnnouncement'); }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const user = await getCaller(req.userId);
    const ann  = await Announcement.findOneAndDelete({ _id: req.params.id, orgId: user?.orgId });
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { sendError(res, err, 'deleteAnnouncement'); }
};

// ── ANALYTICS ─────────────────────────────────────────────────────────────────

exports.getOrgAnalytics = async (req, res) => {
  try {
    const user  = await getCaller(req.userId);
    const orgId = user?.orgId;
    if (!orgId) return res.status(403).json({ message: 'No organisation' });

    const batches  = await Batch.find({ organization: orgId, isActive: true });
    const batchIds = batches.map(b => b._id);
    const [studentIds, assignmentCount, quizIds] = await Promise.all([
      User.find({ orgId, role: STUDENT_ROLE }).distinct('_id'),
      Assignment.countDocuments({ organization: orgId, isActive: true, batch: { $in: batchIds } }),
      orgQuizIds(orgId),
    ]);

    // Every number below covers the same thing: completed attempts by this org's students
    // on this org's own quizzes and on quizzes it has assigned to an active batch
    const scope = { quiz: { $in: quizIds }, completedAt: { $ne: null }, maxScore: { $gt: 0 } };

    const attemptSummary = await Attempt.aggregate([
      { $match: { ...scope, user: { $in: studentIds } } },
      { $lookup: { from: Quiz.collection.name, localField: 'quiz', foreignField: '_id', as: 'q' } },
      { $project: {
        pct:       { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] },
        passScore: { $ifNull: [{ $arrayElemAt: ['$q.passScore', 0] }, 0] },
      }},
      { $group: {
        _id:      null,
        total:    { $sum: 1 },
        avgScore: { $avg: '$pct' },
        // Pass = reaching that quiz's own pass percentage
        passed:   { $sum: { $cond: [{ $gte: ['$pct', '$passScore'] }, 1, 0] } }
      }}
    ]);
    const sm = attemptSummary[0] || { total: 0, avgScore: 0, passed: 0 };

    // Batch performance stats
    const studentSet = new Set(studentIds.map(String));
    const batchStats = await Promise.all(batches.map(async b => {
      const bStudIds = b.students.filter(id => studentSet.has(String(id)));
      const agg = await Attempt.aggregate([
        { $match: { ...scope, user: { $in: bStudIds } } },
        { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } } } }
      ]);
      return {
        batchId: b._id, name: b.name, color: b.color,
        studentCount:  bStudIds.length,
        attemptCount:  agg[0]?.count   || 0,
        avgScore:      Math.round(agg[0]?.avg || 0)
      };
    }));

    // Recent activity (last 15 completions in the same scope)
    const recentAttempts = await Attempt.find({ ...scope, user: { $in: studentIds } })
      .populate('user', 'name').populate('quiz', 'title')
      .sort({ completedAt: -1 }).limit(15);

    const recentActivity = recentAttempts.map(a => ({
      studentName: a.user?.name,
      quizTitle:   a.quiz?.title,
      score:       percent(a),
      completedAt: a.completedAt
    }));

    res.json({
      overview: {
        students:      studentIds.length,
        batches:       batches.length,
        assignments:   assignmentCount,
        totalAttempts: sm.total,
        avgScore:      Math.round(sm.avgScore || 0),
        passRate:      sm.total > 0 ? Math.round((sm.passed / sm.total) * 100) : 0,
        attemptScope:  'Completed attempts by your students on your own and assigned quizzes',
      },
      batchStats,
      recentActivity
    });
  } catch (err) { sendError(res, err, 'getOrgAnalytics'); }
};
