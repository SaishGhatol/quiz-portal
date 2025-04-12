const express = require('express');
const questionController = require('../controllers/question.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { validate, handleValidationErrors } = require('../middleware/validation.middleware');


const router = express.Router();

// Question routes
router.post('/', authenticateJWT, questionController.createQuestion);
router.post('/bulk', authenticateJWT, questionController.bulkCreateQuestions);
router.get('/quiz/:quizId', authenticateJWT, questionController.getQuestionsByQuiz);
router.put('/:id', authenticateJWT, questionController.updateQuestion);
router.delete('/:id', authenticateJWT, questionController.deleteQuestion);
router.get('/quizzes/:quizId/questions', authenticateJWT, questionController.getQuestionsByQuiz);

// Create a new question
router.post('/quizzes/:id/questions', authenticateJWT, (req, res, next) => {
  // Extract quiz ID from URL parameters and add to body
  req.body.quizId = req.params.id;
  next();
}, questionController.createQuestion);

// Update a question
router.put('/quizzes/:id/questions/:questionId', authenticateJWT, (req, res) => {
  // Call the existing controller with the question ID
  req.params.id = req.params.questionId;
  questionController.updateQuestion(req, res);
});

// Delete a question
router.delete('/quizzes/:id/questions/:questionId', authenticateJWT, (req, res) => {
  // Call the existing controller with the question ID
  req.params.id = req.params.questionId;
  questionController.deleteQuestion(req, res);
});

// Bulk create questions
router.post('/quizzes/:id/questions/bulk', authenticateJWT, (req, res, next) => {
  // Extract quiz ID from URL parameters and add to body
  req.body.quizId = req.params.id;
  next();
}, questionController.bulkCreateQuestions);

// Add reorder function (this needs to be added to your controller)
router.put('/quizzes/:id/questions/:questionId/reorder', authenticateJWT, (req, res) => {
  // Since you don't have this yet, we'll forward to a new controller method
  if (typeof questionController.reorderQuestion === 'function') {
    questionController.reorderQuestion(req, res);
  } else {
    res.status(501).json({ message: 'Reordering functionality not implemented yet' });
  }
});
module.exports = router;
