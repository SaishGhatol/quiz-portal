// One visibility rule for quizzes, used by listing, detail, taking and submitting:
// - platform quizzes (no organization) are visible to everyone once published
// - organisation quizzes are visible only to members of that organisation
// - drafts are visible only to their creator, that organisation's admins, and platform admins
const User = require('../models/user.model');

const orgIdFor = async userId => {
  if (!userId) return null;
  const user = await User.findById(userId).select('orgId');
  return user?.orgId || null;
};

/** Mongo filter for quizzes a user may browse and take */
exports.visibleQuizFilter = async req => {
  const orgId = await orgIdFor(req.userId);
  return {
    isPublished: true,
    $or: orgId ? [{ organization: null }, { organization: orgId }] : [{ organization: null }],
  };
};

/** Whether this request may open/take the given quiz document */
exports.canAccessQuiz = async (req, quiz) => {
  if (!quiz) return false;
  if (req.userRole === 'admin') return true;
  if (req.userId && String(quiz.createdBy?._id || quiz.createdBy) === String(req.userId)) return true;

  const orgId = quiz.organization ? await orgIdFor(req.userId) : null;
  if (quiz.organization && String(orgId) !== String(quiz.organization)) return false;

  // Organisation admins can preview their own org's drafts
  if (!quiz.isPublished) return !!quiz.organization && req.userRole === 'org_admin';
  return true;
};

/**
 * Whether this request may manage (edit, add questions to, view results of) a quiz:
 * platform admins always; org admins only for their own organisation's quizzes.
 */
exports.canManageQuiz = async (req, quiz) => {
  if (!quiz) return false;
  if (req.userRole === 'admin') return true;
  if (req.userRole !== 'org_admin' || !quiz.organization) return false;
  return String(await orgIdFor(req.userId)) === String(quiz.organization);
};

// User input is matched literally — never as a regular expression
exports.escapeRegex = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
