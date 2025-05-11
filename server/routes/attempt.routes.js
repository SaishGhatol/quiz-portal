const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attempt.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');

// Attempt routes
router.post('/start', authenticateJWT, attemptController.startAttempt);
router.post('/answer', authenticateJWT, attemptController.submitAnswer);
router.get('/user', authenticateJWT, attemptController.getUserAttempts);
router.get('/:id', attemptController.getAttemptById);

router.put('/:attemptId/complete', authenticateJWT, attemptController.completeAttempt);

router.get('/stats/:quizId', authenticateJWT, attemptController.getQuizStats);
router.get('/attempts/:id', authenticateJWT, attemptController.getAttemptDetails);

module.exports = router;