// const express = require('express');
// const router = express.Router();
// const attemptController = require('../controllers/attempt.controller');
// const { authenticateJWT } = require('../middleware/auth.middleware');

// // Attempt routes
// router.post('/start', authenticateJWT, attemptController.startAttempt);
// router.post('/answer', authenticateJWT, attemptController.submitAnswer);
// router.get('/user', authenticateJWT, attemptController.getUserAttempts);
// router.get('/:id', attemptController.getAttemptById);

// router.put('/:attemptId/complete', authenticateJWT, attemptController.completeAttempt);

// router.get('/stats/:quizId', authenticateJWT, attemptController.getQuizStats);
// router.get('/attempts/:id', authenticateJWT, attemptController.getAttemptDetails);

// module.exports = router;

const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attempt.controller');
const { authenticateJWT,isAdmin } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/attempts/user
 * @desc    Get attempts for the logged in user with optional filtering
 * @access  Private
 */
router.get('/user', authenticateJWT, attemptController.getAttemptsByUser);

/**
 * @route   GET /api/attempts/all
 * @desc    Get all attempts (admin only)
 * @access  Private/Admin
 */
router.get('/all', isAdmin,authenticateJWT, attemptController.getAllAttempts);

/**
 * @route   GET /api/attempts/stats/:quizId
 * @desc    Get statistics for a specific quiz
 * @access  Private/Admin or Quiz Creator
 */
router.get('/stats/:quizId', authenticateJWT, attemptController.getQuizStats);

/**
 * @route   GET /api/attempts/:id
 * @desc    Get a specific attempt by ID
 * @access  Private/Owner or Admin
 */
router.get('/:id', authenticateJWT, attemptController.getAttemptById);

/**
 * @route   POST /api/attempts/start
 * @desc    Start a new quiz attempt
 * @access  Private
 */
router.post('/start', authenticateJWT, attemptController.startAttempt);

/**
 * @route   POST /api/attempts/answer
 * @desc    Submit an answer for a question
 * @access  Private/Owner
 */
router.post('/answer', authenticateJWT, attemptController.submitAnswer);

/**
 * @route   POST /api/attempts/:attemptId/complete
 * @desc    Complete a quiz attempt
 * @access  Private/Owner
 */
router.post('/:attemptId/complete', authenticateJWT, attemptController.completeAttempt);

/**
 * @route   DELETE /api/attempts/:id
 * @desc    Delete an attempt
 * @access  Private/Admin
 */
router.delete('/:id', authenticateJWT, attemptController.deleteAttempt);

module.exports = router;