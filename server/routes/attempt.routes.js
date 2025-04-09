const express = require('express');
const attemptController = require('../controllers/attempt.controller');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Attempt routes
router.post('/start', authenticateJWT, attemptController.startAttempt);
router.post('/answer', authenticateJWT, attemptController.submitAnswer);
router.put('/:attemptId/complete', authenticateJWT, attemptController.completeAttempt);
router.get('/user', authenticateJWT, attemptController.getUserAttempts);
router.get('/:id', authenticateJWT, attemptController.getAttemptDetails);
router.get('/stats/:quizId', authenticateJWT, attemptController.getQuizStats);

module.exports = router;