// quizRoutes.js
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/', quizController.getAllQuizzes);

// Important: place before `/:id` routes
router.get('/:id/questions', authenticateJWT, quizController.getQuizById);
router.get('/:id', authenticateJWT, quizController.getQuizById);

// Admin routes
router.post('/', authenticateJWT, isAdmin, quizController.createQuiz);
router.put('/:id', authenticateJWT, isAdmin, quizController.updateQuiz);
router.delete('/:id', authenticateJWT, isAdmin, quizController.deleteQuiz);

// Quiz attempts
router.get('/attempts/:id', authenticateJWT, quizController.getQuizAttemptById);
router.post('/:id/submit', authenticateJWT, quizController.submitQuizAttempt);

router.get('/:id/statistics',authenticateJWT, quizController.getQuizStatistics);
router.get('/:id/attempts', authenticateJWT, quizController.getRecentAttemptsByQuizId);module.exports = router;