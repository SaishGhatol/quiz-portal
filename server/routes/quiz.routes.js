const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');

// Public
router.get('/', quizController.getAllQuizzes);

// Important: place before `/:id`
router.get('/:id/questions', authenticateJWT, quizController.getQuizById);
router.get('/:id', authenticateJWT, quizController.getQuizById);

// Admin routes
router.post('/', authenticateJWT, isAdmin, quizController.createQuiz);
router.put('/:id', authenticateJWT, isAdmin, quizController.updateQuiz);
router.delete('/:id', authenticateJWT, isAdmin, quizController.deleteQuiz);

// Attempts
router.get('/attempts/:id', authenticateJWT, quizController.getQuizAttemptById);
router.post('/:id/submit', authenticateJWT, quizController.submitQuizAttempt);
router.get('/my-attempts', authenticateJWT, quizController.getUserAttempts);

module.exports = router;
