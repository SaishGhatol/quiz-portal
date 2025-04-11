// server/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');

// Apply authentication and admin authorization to all routes
router.use(authenticateJWT, isAdmin);

// Dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

// Quiz management routes
router.get('/quizzes', adminController.getAllQuizzes);
router.get('/quizzes/:id', adminController.getQuizById);

router.get('/quizzes/:id/statistics', adminController.getQuizStatistics);
router.get('/quizzes/:id/attempts', adminController.getRecentAttempts);


// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Attempts management
router.get('/attempts', adminController.getAllAttempts);
router.get('/attempts/:id', adminController.getAttemptById);

// Question management routes
router.get('/questions', adminController.getAllQuestions);
// router.get('/questions/:id', adminController.getQuestionById);
// router.put('/questions/:id', adminController.updateQuestion);
// router.delete('/questions/:id', adminController.deleteQuestion);



module.exports = router;