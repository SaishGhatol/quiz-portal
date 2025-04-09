const express = require('express');
const userController = require('../controllers/auth.controller');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// User routes
router.get('/', authenticateJWT, isAdmin, userController.getAllUsers);
router.get('/:id', authenticateJWT, userController.getUserProfile);
router.put('/:id', authenticateJWT, userController.updateProfile);
router.put('/:id/password', authenticateJWT, userController.changePassword);
router.put('/:id/role', authenticateJWT, isAdmin, userController.changeUserRole);

module.exports = router;