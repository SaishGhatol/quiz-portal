const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attempt.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');

// Attempt routes
router.post('/start', authenticateJWT, attemptController.startAttempt);
router.post('/answer', authenticateJWT, attemptController.submitAnswer);
router.get('/my-attempts', authenticateJWT, attemptController.getUserAttempts);

router.put('/:attemptId/complete', authenticateJWT, attemptController.completeAttempt);
router.get('/:id', authenticateJWT,attemptController.getAttemptDetails);
router.get('/stats/:quizId', authenticateJWT, attemptController.getQuizStats);

module.exports = router;