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
router.post('/', adminController.createQuiz);  
router.get('/quizzes/recent', adminController.getRecentQuizzes);
router.get('/quizzes/:id', adminController.getQuizById);
router.get('/quizzes/:id/attempts', adminController.getRecentAttempts);

// User management routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);

// Question management routes
// For getting all questions of a specific quiz
router.get('/quizzes/:id/questions', adminController.getQuizQuestions);
router.post('/quizzes/:id/questions', adminController.addQuestion);
router.put('/quizzes/:id/questions/:questionId', adminController.updateQuestion);
router.put('/quizzes/:id/questions/:questionId/reorder', adminController.reorderQuestion);

module.exports = router;