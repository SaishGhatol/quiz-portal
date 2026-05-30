const express            = require('express');
const questionController = require('../controllers/question.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');

const router = express.Router();

// All question routes are now mounted at /api/questions
// (previously mounted at /api which caused conflicts with /api/org etc.)

// Single question CRUD
router.post('/',       questionController.createQuestion);
router.post('/bulk',   questionController.bulkCreateQuestions);
router.get('/:id',     questionController.getQuestionsByQuiz);   // get by quiz id
router.put('/:id',     questionController.updateQuestion);
router.delete('/:id',  questionController.deleteQuestion);

// Nested: questions for a specific quiz
router.get('/quiz/:quizId',  questionController.getQuestionsByQuiz);

// Nested quiz question routes (kept for backward compat)
router.post('/quizzes/:id/questions', (req, res, next) => {
  req.body.quizId = req.params.id;
  next();
}, questionController.createQuestion);

router.put('/quizzes/:id/questions/:questionId', (req, res) => {
  req.params.id = req.params.questionId;
  questionController.updateQuestion(req, res);
});

router.delete('/quizzes/:id/questions/:questionId', (req, res) => {
  req.params.id = req.params.questionId;
  questionController.deleteQuestion(req, res);
});

router.post('/quizzes/:id/questions/bulk', (req, res, next) => {
  req.body.quizId = req.params.id;
  next();
}, questionController.bulkCreateQuestions);

router.put('/quizzes/:id/questions/:questionId/reorder', (req, res) => {
  if (typeof questionController.reorderQuestion === 'function') {
    questionController.reorderQuestion(req, res);
  } else {
    res.status(501).json({ message: 'Reorder not implemented' });
  }
});

module.exports = router;
