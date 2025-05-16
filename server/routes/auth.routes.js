const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { validate, handleValidationErrors } = require('../middleware/validation.middleware');

// Public routes
router.post('/register', handleValidationErrors, authController.register);
router.post('/login', handleValidationErrors, authController.login);

// Protected routes
router.get('/me', authenticateJWT, authController.getCurrentUser);

module.exports = router;