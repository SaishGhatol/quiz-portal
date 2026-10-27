// quizRoutes.js
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { authenticateJWT, optionalAuth, isOrgAdmin } = require('../middleware/auth.middleware');
const { objectIdParam } = require('../middleware/objectId.middleware');

// Malformed ids answer 400 instead of surfacing as 500 CastErrors
router.param('id', objectIdParam);

// Public routes — guests see platform quizzes; signed-in members also see their organisation's
router.get('/', optionalAuth, quizController.getAllQuizzes);
router.get('/stats', quizController.getPlatformStats);
router.get('/leaderboard', optionalAuth, quizController.getLeaderboard);

// Taking a quiz: start records the server-side start time, submit scores against it
router.get('/:id/eligibility', authenticateJWT, quizController.getQuizEligibility);
router.post('/:id/start', authenticateJWT, quizController.startQuiz);
router.post('/:id/submit', authenticateJWT, quizController.submitQuizAttempt);

// Results (quiz administrators only) and attempts (owner or quiz administrators)
router.get('/:id/attempts', authenticateJWT, quizController.getRecentAttemptsByQuizId);
router.get('/attempts/:id', authenticateJWT, quizController.getQuizAttemptById);
router.get('/:id/statistics', authenticateJWT, quizController.getQuizStatistics);
router.get('/:id/questions', authenticateJWT, quizController.getQuizById);
router.get('/my-attempts', authenticateJWT, quizController.getUserAttempts);

// Quiz details routes (must be after all specific `/:id/...` routes)
router.get('/:id', authenticateJWT, quizController.getQuizById);
router.put('/:id', authenticateJWT, isOrgAdmin, quizController.updateQuiz);
router.delete('/:id', authenticateJWT, isOrgAdmin, quizController.deleteQuiz);

module.exports = router;
