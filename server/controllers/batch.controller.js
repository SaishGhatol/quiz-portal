const Batch        = require('../models/batch.model');
const User         = require('../models/user.model');
const Organization = require('../models/organization.model');
const Assignment   = require('../models/assignment.model');
const Attempt      = require('../models/attempt.model');

// ── Helper: get orgId for current user ──────────────────────────────────────
const getOrgId = async (userId) => {
  const user = await User.findById(userId).select('orgId');
  return user?.orgId;
};

// ── Create batch ─────────────────────────────────────────────────────────────
exports.createBatch = async (req, res) => {
  try {
    const orgId = await getOrgId(req.userId);
    if (!orgId) return res.status(403).json({ message: 'No organisation found' });

    const { name, description, subject, academicYear, color } = req.body;

    const batch = await Batch.create({
      name, description, subject, academicYear, color,
      organization: orgId,
      createdBy:    req.userId
    });

    res.status(201).json({ message: 'Batch created', batch });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Join code collision — please retry' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Get all batches for org ───────────────────────────────────────────────────
exports.getBatches = async (req, res) => {
  try {
    const orgId = await getOrgId(req.userId);
    if (!orgId) return res.status(403).json({ message: 'No organisation found' });

    const batches = await Batch.find({ organization: orgId, isActive: true })
      .sort({ createdAt: -1 });

    // Enrich with assignment count
    const enriched = await Promise.all(batches.map(async b => ({
      ...b.toObject(),
      studentCount:    b.students.length,
      assignmentCount: await Assignment.countDocuments({ batch: b._id, isActive: true })
    })));

    res.json({ batches: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Get single batch detail ───────────────────────────────────────────────────
exports.getBatchById = async (req, res) => {
  try {
    const orgId = await getOrgId(req.userId);
    const batch = await Batch.findById(req.params.id)
      .populate('students', 'name email createdAt')
      .populate('createdBy', 'name');

    if (!batch || batch.organization.toString() !== orgId?.toString()) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    const assignments = await Assignment.find({ batch: batch._id, isActive: true })
      .populate('quiz', 'title category difficulty timeLimit totalQuestions')
      .sort({ createdAt: -1 });

    res.json({ batch, assignments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Update batch ──────────────────────────────────────────────────────────────
exports.updateBatch = async (req, res) => {
  try {
    const orgId = await getOrgId(req.userId);
    const batch = await Batch.findOne({ _id: req.params.id, organization: orgId });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    ['name', 'description', 'subject', 'academicYear', 'color', 'isActive'].forEach(k => {
      if (req.body[k] !== undefined) batch[k] = req.body[k];
    });
    await batch.save();
    res.json({ message: 'Batch updated', batch });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Delete batch ──────────────────────────────────────────────────────────────
exports.deleteBatch = async (req, res) => {
  try {
    const orgId = await getOrgId(req.userId);
    const batch = await Batch.findOneAndDelete({ _id: req.params.id, organization: orgId });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    // Clean up assignments for this batch
    await Assignment.deleteMany({ batch: req.params.id });

    // Remove batch from students' batchIds
    await User.updateMany(
      { batchIds: req.params.id },
      { $pull: { batchIds: req.params.id } }
    );

    res.json({ message: 'Batch deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Add students by email list ────────────────────────────────────────────────
exports.addStudents = async (req, res) => {
  try {
    const orgId = await getOrgId(req.userId);
    const batch = await Batch.findOne({ _id: req.params.id, organization: orgId });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    const emails = (req.body.emails || []).map(e => e.toLowerCase().trim()).filter(Boolean);
    if (!emails.length) return res.status(400).json({ message: 'No emails provided' });

    const users = await User.find({ email: { $in: emails } });
    const found  = users.map(u => u._id.toString());
    const notFound = emails.filter(e => !users.find(u => u.email === e));

    // Add to batch (avoid duplicates)
    const toAdd = users.filter(u => !batch.students.includes(u._id.toString()));
    batch.students.push(...toAdd.map(u => u._id));
    await batch.save();

    // Update each student's orgId and batchIds
    await Promise.all(toAdd.map(u =>
      User.findByIdAndUpdate(u._id, {
        orgId: orgId,
        $addToSet: { batchIds: batch._id }
      })
    ));

    res.json({
      message: `Added ${toAdd.length} student(s)`,
      added:    toAdd.map(u => ({ _id: u._id, name: u.name, email: u.email })),
      notFound
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Remove student from batch ─────────────────────────────────────────────────
exports.removeStudent = async (req, res) => {
  try {
    const orgId = await getOrgId(req.userId);
    const batch = await Batch.findOne({ _id: req.params.id, organization: orgId });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    batch.students = batch.students.filter(s => s.toString() !== req.params.userId);
    await batch.save();

    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { batchIds: batch._id }
    });

    res.json({ message: 'Student removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Join batch via join code (student action) ─────────────────────────────────
exports.joinBatch = async (req, res) => {
  try {
    const { joinCode } = req.body;
    const batch = await Batch.findOne({ joinCode: joinCode?.toUpperCase(), isActive: true });
    if (!batch) return res.status(404).json({ message: 'Invalid join code' });

    const org = await Organization.findById(batch.organization);
    if (!org?.settings?.allowSelfEnroll) {
      return res.status(403).json({ message: 'Self-enrolment is disabled for this organisation' });
    }

    if (batch.students.includes(req.userId)) {
      return res.status(200).json({ message: 'Already enrolled', batch });
    }

    batch.students.push(req.userId);
    await batch.save();

    await User.findByIdAndUpdate(req.userId, {
      orgId: batch.organization,
      $addToSet: { batchIds: batch._id }
    });

    res.json({ message: 'Joined batch', batch });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ── Batch analytics ───────────────────────────────────────────────────────────
exports.getBatchAnalytics = async (req, res) => {
  try {
    const orgId = await getOrgId(req.userId);
    const batch = await Batch.findOne({ _id: req.params.id, organization: orgId })
      .populate('students', 'name email');
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    const assignments = await Assignment.find({ batch: batch._id, isActive: true })
      .populate('quiz', 'title');

    // For each assignment, compute per-student completion and score
    const analyticsPerAssignment = await Promise.all(assignments.map(async asgn => {
      const attempts = await Attempt.find({
        quiz: asgn.quiz,
        user: { $in: batch.students.map(s => s._id) },
        completedAt: { $ne: null }
      }).populate('user', 'name email');

      const completedIds = new Set(attempts.map(a => a.user._id.toString()));

      return {
        assignment: { _id: asgn._id, title: asgn.title || asgn.quiz?.title, dueDate: asgn.dueDate },
        total:      batch.students.length,
        completed:  completedIds.size,
        pct:        batch.students.length ? Math.round((completedIds.size / batch.students.length) * 100) : 0,
        avgScore:   attempts.length
          ? Math.round(attempts.reduce((s, a) => s + (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0), 0) / attempts.length)
          : 0,
        notCompleted: batch.students.filter(s => !completedIds.has(s._id.toString())).map(s => ({ _id: s._id, name: s.name, email: s.email }))
      };
    }));

    // Per-student overall stats
    const studentStats = await Promise.all(batch.students.map(async student => {
      const allAttempts = await Attempt.find({
        user: student._id,
        quiz: { $in: assignments.map(a => a.quiz) },
        completedAt: { $ne: null }
      });
      const avg = allAttempts.length
        ? Math.round(allAttempts.reduce((s, a) => s + (a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0), 0) / allAttempts.length)
        : null;
      return {
        _id:       student._id,
        name:      student.name,
        email:     student.email,
        completed: allAttempts.length,
        total:     assignments.length,
        avgScore:  avg
      };
    }));

    res.json({ batch: { _id: batch._id, name: batch.name }, analyticsPerAssignment, studentStats });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
