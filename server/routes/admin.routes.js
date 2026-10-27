const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateJWT, isAdmin, isOrgAdmin } = require('../middleware/auth.middleware');
const { objectIdParam } = require('../middleware/objectId.middleware');

// Malformed ids answer 400 instead of surfacing as a 500 CastError
router.param('id', objectIdParam);

// All routes below require a logged-in user
router.use(authenticateJWT);

// ── Dashboard & analytics ───────────────────────────────────────────────────
// Dashboard stats are shared: platform admin sees platform-wide numbers,
// org admin sees numbers scoped to their own organisation (see controller).
router.get('/dashboard/stats', isOrgAdmin, adminController.getDashboardStats);

// Platform-wide analytics, exports and user management: platform admin only
router.get('/analytics',       isAdmin, adminController.getAnalytics);
router.get('/export/users',    isAdmin, adminController.exportUsersCSV);
router.get('/export/attempts', isAdmin, adminController.exportAttemptsCSV);
router.get('/users',           isAdmin, adminController.getAllUsers);
router.get('/users/:id',       isAdmin, adminController.getUserById);
router.put('/users/:id',       isAdmin, adminController.updateUser);
router.delete('/users/:id',    isAdmin, adminController.deleteUser);

// ── Quiz management ──────────────────────────────────────────────────────────
// Org admins manage quizzes for their own organisation; platform admins manage
// everything. Per-organisation scoping is enforced inside the controller.
// (Question CRUD itself lives under /api/questions.)
router.get   ('/quizzes',                     isOrgAdmin, adminController.getAllQuizzes);
router.post  ('/quizzes/create',              isOrgAdmin, adminController.createQuiz);
router.get   ('/quizzes/recent',              isOrgAdmin, adminController.getRecentQuizzes);
router.get   ('/quizzes/attempts/recent',     isOrgAdmin, adminController.getRecentAttempts);
router.post  ('/quizzes/:id/duplicate',       isOrgAdmin, adminController.duplicateQuiz);
router.put   ('/quizzes/:id/questions/order', isOrgAdmin, adminController.updateQuestionOrder);

module.exports = router;
