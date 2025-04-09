const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/', quizController.getAllQuizzes);
router.get('/:id', authenticateJWT, quizController.getQuizById);

// Protected routes
router.post('/', authenticateJWT, isAdmin, quizController.createQuiz);
router.put('/:id', authenticateJWT, isAdmin, quizController.updateQuiz);
router.delete('/:id', authenticateJWT, isAdmin, quizController.deleteQuiz);

// Attempt routes
router.post('/submit', authenticateJWT, quizController.submitQuizAttempt);
router.get('/attempts/:id', authenticateJWT, quizController.getQuizAttemptById);
router.get('/user/attempts', authenticateJWT, quizController.getUserAttempts);

module.exports = router;