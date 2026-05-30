const Organization = require('../models/organization.model');
const Batch        = require('../models/batch.model');
const User         = require('../models/user.model');
const Attempt      = require('../models/attempt.model');
const Assignment   = require('../models/assignment.model');

// ── Create organization ──────────────────────────────────────────────────────
exports.createOrg = async (req, res) => {
  try {
    const { name, description, contactEmail, type, website, address, phone } = req.body;

    const org = await Organization.create({
      name,
      description,
      contactEmail,
      type,
      website,
      address,
      phone,
      createdBy:  req.userId,
      adminUsers: [req.userId]
    });

    // Give the creator org_admin role
    await User.findByIdAndUpdate(req.userId, {
      role:  'org_admin',
      orgId: org._id
    });

    res.status(201).json({ message: 'Organisation created', org });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Organisation already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Get current user's organisation ─────────────────────────────────────────
exports.getMyOrg = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('orgId role');
    if (!user?.orgId) return res.status(404).json({ message: 'No organisation found' });

    const org = await Organization.findById(user.orgId)
      .populate('adminUsers', 'name email');
    if (!org) return res.status(404).json({ message: 'Organisation not found' });

    res.json({ org });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Update org ───────────────────────────────────────────────────────────────
exports.updateOrg = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('orgId');
    const org  = await Organization.findById(user?.orgId);
    if (!org) return res.status(404).json({ message: 'Organisation not found' });

    const allowed = ['name', 'description', 'contactEmail', 'website', 'address', 'phone', 'logo', 'settings'];
    allowed.forEach(k => { if (req.body[k] !== undefined) org[k] = req.body[k]; });
    await org.save();

    res.json({ message: 'Organisation updated', org });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Org-level dashboard stats ────────────────────────────────────────────────
exports.getOrgStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('orgId');
    const orgId = user?.orgId;
    if (!orgId) return res.status(404).json({ message: 'No organisation found' });

    const [batches, studentCount, assignments, recentAttempts] = await Promise.all([
      Batch.find({ organization: orgId, isActive: true }),
      User.countDocuments({ orgId }),
      Assignment.find({ organization: orgId, isActive: true }).populate('quiz', 'title').populate('batch', 'name'),
      Attempt.find()
        .populate({
          path: 'user',
          match: { orgId },
          select: 'name orgId'
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('quiz', 'title')
    ]);

    const validAttempts = recentAttempts.filter(a => a.user);
    const totalAttempts = await Attempt.countDocuments();

    // Completion stats per assignment
    const assignmentStats = await Promise.all(
      assignments.map(async asgn => {
        const batchStudents = (await Batch.findById(asgn.batch)).students.length;
        const completed = await Attempt.countDocuments({
          quiz: asgn.quiz,
          user: { $in: (await Batch.findById(asgn.batch)).students }
        });
        return {
          _id:         asgn._id,
          title:       asgn.title || asgn.quiz?.title,
          batchName:   asgn.batch?.name,
          dueDate:     asgn.dueDate,
          total:       batchStudents,
          completed,
          pct:         batchStudents ? Math.round((completed / batchStudents) * 100) : 0
        };
      })
    );

    res.json({
      totalStudents:  studentCount,
      totalBatches:   batches.length,
      totalAssignments: assignments.length,
      recentAttempts: validAttempts.slice(0, 10),
      assignmentStats
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Add admin user to org ────────────────────────────────────────────────────
exports.addAdminUser = async (req, res) => {
  try {
    const { email } = req.body;
    const user      = await User.findById(req.userId).select('orgId');
    const org       = await Organization.findById(user?.orgId);
    if (!org) return res.status(404).json({ message: 'Organisation not found' });

    const target = await User.findOne({ email });
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (!org.adminUsers.includes(target._id)) org.adminUsers.push(target._id);
    await org.save();
    await User.findByIdAndUpdate(target._id, { role: 'org_admin', orgId: org._id });

    res.json({ message: 'Admin added', org });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Platform admin: list all orgs ───────────────────────────────────────────
exports.getAllOrgs = async (req, res) => {
  try {
    const orgs = await Organization.find()
      .populate('adminUsers', 'name email')
      .sort({ createdAt: -1 });
    res.json({ orgs });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
