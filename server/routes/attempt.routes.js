const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attempt.controller');
const quizController = require('../controllers/quiz.controller');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');
const { objectIdParam } = require('../middleware/objectId.middleware');

router.param('id', objectIdParam);

// Attempts are created only through POST /api/quizzes/:id/start + /submit, which enforce
// visibility, assignment limits and server-side timing. The old start/answer/complete
// endpoints that used to live here bypassed all of that and have been removed.

/**
 * @route   GET /api/attempts/user
 * @desc    Attempts for the signed-in user
 */
router.get('/user', authenticateJWT, attemptController.getAttemptsByUser);

/**
 * @route   GET /api/attempts/all
 * @desc    All attempts (platform admin only)
 */
router.get('/all', authenticateJWT, isAdmin, attemptController.getAllAttempts);

/**
 * @route   GET /api/attempts/:id
 * @desc    One attempt — its owner, platform admins, or admins of the quiz's organisation
 */
router.get('/:id', authenticateJWT, quizController.getAttemptDetail);

/**
 * @route   DELETE /api/attempts/:id
 * @desc    Delete an attempt (platform admin only)
 */
router.delete('/:id', authenticateJWT, isAdmin, attemptController.deleteAttempt);

module.exports = router;
