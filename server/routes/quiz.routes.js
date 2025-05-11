// quizRoutes.js
const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/', quizController.getAllQuizzes);

// Routes for quiz attempts (placed early to avoid conflicts with '/:id')
router.post('/:id/submit', authenticateJWT, quizController.submitQuizAttempt);
router.get('/:id/attempts', authenticateJWT, quizController.getRecentAttemptsByQuizId);
router.get('/attempts/:id', authenticateJWT, quizController.getQuizAttemptById);
router.get('/:id/statistics', authenticateJWT, quizController.getQuizStatistics);
router.get('/:id/questions', authenticateJWT, quizController.getQuizById); 
router.get("/my-attempts" ,authenticateJWT,quizController.getUserAttempts)


// Quiz details routes (must be after all specific `/:id/...` routes)]]
router.get('/:id', authenticateJWT, quizController.getQuizById);
router.put('/:id', authenticateJWT, isAdmin, quizController.updateQuiz);
router.delete('/:id', authenticateJWT, isAdmin, quizController.deleteQuiz);

module.exports = router;
