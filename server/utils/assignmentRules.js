// Assignment rules shared by quiz taking, attempt review and practice mode.
const User = require('../models/user.model');
const Assignment = require('../models/assignment.model');
const Attempt = require('../models/attempt.model');

const fmtDay = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * Applies the rules of any assignment that covers this quiz for this student.
 * - While an assignment is open, its attempt limit applies.
 * - An organisation quiz assigned only through closed/upcoming assignments can't be taken.
 * - Platform quizzes stay available for practice outside an assignment's window.
 * Returns { ok, state, message, attemptsLeft } where state is
 * 'none' | 'open' | 'upcoming' | 'closed' | 'exhausted'.
 */
const checkAssignmentRules = async (userId, quiz) => {
  const user = await User.findById(userId).select('batchIds');
  if (!user?.batchIds?.length) return { ok: true, state: 'none' };

  const assignments = await Assignment.find({ quiz: quiz._id, batch: { $in: user.batchIds }, isActive: true })
    .populate('batch', 'isActive');
  const live = assignments.filter(a => a.batch && a.batch.isActive !== false);
  if (!live.length) return { ok: true, state: 'none' };

  const now = new Date();
  const open = live.filter(a => (!a.startDate || a.startDate <= now) && (!a.dueDate || a.dueDate >= now));

  if (!open.length) {
    const upcomingFirst = live.some(a => a.startDate && a.startDate > now);
    if (!quiz.organization) return { ok: true, state: upcomingFirst ? 'upcoming' : 'closed' };
    const upcoming = live.filter(a => a.startDate && a.startDate > now).sort((a, b) => a.startDate - b.startDate)[0];
    if (upcoming) return { ok: false, state: 'upcoming', message: `This assignment opens on ${fmtDay(upcoming.startDate)}.` };
    const lastDue = live.map(a => a.dueDate).filter(Boolean).sort((a, b) => b - a)[0];
    return { ok: false, state: 'closed', message: `This assignment closed${lastDue ? ` on ${fmtDay(lastDue)}` : ''}.` };
  }

  // The open assignment with the most attempts left decides
  let best = null;
  for (const a of open) {
    const used = await Attempt.countDocuments({
      user: userId, quiz: quiz._id,
      completedAt: { $ne: null, ...(a.startDate ? { $gte: a.startDate } : {}) },
    });
    const left = Math.max(0, (a.maxAttempts || 1) - used);
    if (!best || left > best.left) best = { left, max: a.maxAttempts || 1 };
  }
  if (best.left === 0) {
    return { ok: false, state: 'exhausted', message: `You've used all ${best.max} attempt${best.max === 1 ? '' : 's'} for this assignment.` };
  }
  return { ok: true, state: 'open', attemptsLeft: best.left };
};

module.exports = { checkAssignmentRules };
