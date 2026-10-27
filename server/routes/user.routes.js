const express = require('express');
const userController = require('../controllers/auth.controller');
const { authenticateJWT, isAdmin, isSelfOrAdmin, isSelf } = require('../middleware/auth.middleware');
const practice = require('../controllers/practice.controller');
const { objectIdParam } = require('../middleware/objectId.middleware');

const router = express.Router();

router.param('quizId', objectIdParam);

// User routes
router.delete('/me', authenticateJWT, userController.deleteMyAccount);

// Saved quizzes (declared before '/:id' so 'me' isn't read as a user id)
router.get('/me/saved', authenticateJWT, practice.getSaved);
router.put('/me/saved/:quizId', authenticateJWT, practice.saveQuiz);
router.delete('/me/saved/:quizId', authenticateJWT, practice.unsaveQuiz);

router.get('/', authenticateJWT, isAdmin, userController.getAllUsers);
router.get('/:id', authenticateJWT, isSelfOrAdmin, userController.getUserProfile);
router.put('/:id', authenticateJWT, isSelfOrAdmin, userController.updateProfile);
router.put('/:id/password', authenticateJWT, isSelf, userController.changePassword);
router.put('/:id/role', authenticateJWT, isAdmin, userController.changeUserRole);

module.exports = router;