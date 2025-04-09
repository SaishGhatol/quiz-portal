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

module.exports = router;
