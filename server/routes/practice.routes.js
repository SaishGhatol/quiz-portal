const express = require('express');
const router = express.Router();
const practice = require('../controllers/practice.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { objectIdParam } = require('../middleware/objectId.middleware');

router.param('id', objectIdParam);
router.use(authenticateJWT);

// Untimed practice with instant feedback — never recorded as an attempt
router.get('/quizzes/:id', practice.getPracticeQuiz);
router.post('/check', practice.checkAnswer);

// Questions you've got wrong and haven't fixed in practice yet
router.get('/mistakes', practice.getMistakes);

module.exports = router;
