const { body, validationResult } = require('express-validator');

exports.validate = (method) => {
  switch (method) {
    case 'register': {
      return [
        body('name', 'Name is required').notEmpty().trim(),
        body('email', 'Please include a valid email').isEmail().normalizeEmail(),
        body('password', 'Password must be at least 6 characters').isLength({ min: 6 })
      ];
    }
    case 'login': {
      return [
        body('email', 'Please include a valid email').isEmail().normalizeEmail(),
        body('password', 'Password is required').exists()
      ];
    }
    case 'createQuiz': {
      return [
        body('title', 'Title is required').notEmpty().trim(),
        body('description', 'Description is required').notEmpty(),
        body('category', 'Category is required').notEmpty().trim(),
        body('difficulty', 'Difficulty must be easy, medium, or hard').isIn(['easy', 'medium', 'hard']),
        body('timeLimit', 'Time limit must be a positive number').isInt({ min: 1 }),
        body('passScore', 'Pass score is required').isInt({ min: 0 })
      ];
    }
    case 'createQuestion': {
      return [
        body('quizId', 'Quiz ID is required').isMongoId(),
        body('text', 'Question text is required').notEmpty(),
        body('type', 'Question type must be multiple, single, truefalse, or text')
          .isIn(['multiple', 'single', 'truefalse', 'text']),
        body('options', 'Options must be an array').isArray(),
        body('options.*.text', 'Each option must have text').notEmpty()
      ];
    }
    // Add more validation rules as needed
  }
};

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};