const express            = require('express');
const questionController = require('../controllers/question.controller');
const { isOrgAdmin }     = require('../middleware/auth.middleware');
const { objectIdParam }  = require('../middleware/objectId.middleware');

const router = express.Router();

// All question routes are mounted at /api/questions behind authenticateJWT (see index.js).
// Writes need an org admin or platform admin; the controller then checks canManageQuiz,
// so org admins can only touch their own organisation's quizzes.

router.param('id', objectIdParam);
router.param('quizId', objectIdParam);
router.param('questionId', objectIdParam);

// Questions for a quiz (answer keys only for managers with ?withAnswers=true)
router.get('/quiz/:quizId', questionController.getQuestionsByQuiz);

// Single question CRUD
router.post('/',       isOrgAdmin, questionController.createQuestion);
router.post('/bulk',   isOrgAdmin, questionController.bulkCreateQuestions);
router.get('/:id',     questionController.getQuestionById);
router.put('/:id',     isOrgAdmin, questionController.updateQuestion);
router.delete('/:id',  isOrgAdmin, questionController.deleteQuestion);

// Nested quiz question routes (kept for backward compat)
router.post('/quizzes/:id/questions', isOrgAdmin, (req, res, next) => {
  req.body = { ...(req.body || {}), quizId: req.params.id };
  questionController.createQuestion(req, res, next);
});

router.post('/quizzes/:id/questions/bulk', isOrgAdmin, (req, res, next) => {
  req.body = { ...(req.body || {}), quizId: req.params.id };
  questionController.bulkCreateQuestions(req, res, next);
});

router.put('/quizzes/:id/questions/:questionId', isOrgAdmin, (req, res, next) => {
  req.params.id = req.params.questionId;
  questionController.updateQuestion(req, res, next);
});

router.delete('/quizzes/:id/questions/:questionId', isOrgAdmin, (req, res, next) => {
  req.params.id = req.params.questionId;
  questionController.deleteQuestion(req, res, next);
});

router.put('/quizzes/:id/questions/:questionId/reorder', isOrgAdmin, questionController.reorderQuestion);

module.exports = router;
