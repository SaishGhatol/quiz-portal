const Quiz = require('../models/quiz.model');
const Question = require('../models/question.model');
const Attempt = require('../models/attempt.model');

// Create new quiz (admin only)
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, category, difficulty, timeLimit, passScore } = req.body;
    
    const quiz = new Quiz({
      title,
      description,
      category,
      difficulty,
      timeLimit,
      passScore,
      createdBy: req.userId
    });
    
    const savedQuiz = await quiz.save();
    res.status(201).json({
      message: 'Quiz created successfully',
      quiz: savedQuiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Server error creating quiz' });
  }
};

// Get all quizzes (with filters)
exports.getAllQuizzes = async (req, res) => {
  try {
    const { category, difficulty, search } = req.query;
    let query = { isActive: true };
    
    // Apply filters if provided
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (search) query.title = { $regex: search, $options: 'i' };
    
    // For admin users, show all quizzes including inactive ones
    if (req.userRole === 'admin') {
      delete query.isActive;
    }
    
    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({ quizzes });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Server error fetching quizzes' });
  }
};

// Get quiz by ID with questions
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('createdBy', 'name');
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // If not admin and quiz is inactive, deny access
    if (req.userRole !== 'admin' && !quiz.isActive) {
      return res.status(403).json({ message: 'This quiz is not currently available' });
    }
    
    // Get quiz questions
    const questions = await Question.find({ quizId: quiz._id })
      .select(req.userRole === 'admin' ? '+options.isCorrect' : '-options.isCorrect');
    
    res.json({
      quiz,
      questions: req.userRole === 'admin' ? questions : questions.map(q => ({
        ...q._doc,
        options: q.options.map(opt => ({ text: opt.text }))
      }))
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Server error fetching quiz' });
  }
};

// Update quiz (admin only)
exports.updateQuiz = async (req, res) => {
  try {
    const { title, description, category, difficulty, timeLimit, passScore, isActive } = req.body;
    
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Update quiz fields
    quiz.title = title || quiz.title;
    quiz.description = description || quiz.description;
    quiz.category = category || quiz.category;
    quiz.difficulty = difficulty || quiz.difficulty;
    quiz.timeLimit = timeLimit || quiz.timeLimit;
    quiz.passScore = passScore || quiz.passScore;
    
    // Only set isActive if it's provided
    if (typeof isActive !== 'undefined') {
      quiz.isActive = isActive;
    }
    
    const updatedQuiz = await quiz.save();
    
    res.json({
      message: 'Quiz updated successfully',
      quiz: updatedQuiz
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Server error updating quiz' });
  }
};

// Delete quiz (admin only)
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Delete all questions related to this quiz
    await Question.deleteMany({ quizId: quiz._id });
    
    // Delete the quiz
    await quiz.remove();
    
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error deleting quiz' });
  }
};

// Submit quiz attempt
exports.submitQuizAttempt = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    
    // Find the quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Get all questions for this quiz
    const questions = await Question.find({ quizId });
    
    // Calculate score
    let score = 0;
    const maxScore = questions.reduce((total, q) => total + q.points, 0);
    
    const processedAnswers = [];
    
    // Process each answer
    for (const answer of answers) {
      const question = questions.find(q => q._id.toString() === answer.questionId);
      
      if (!question) continue;
      
      let isCorrect = false;
      let pointsEarned = 0;
      
      // Check if answer is correct based on question type
      if (question.type === 'single' || question.type === 'truefalse') {
        // Find the correct option
        const correctOption = question.options.find(opt => opt.isCorrect);
        isCorrect = correctOption && answer.selectedAnswer === correctOption.text;
      } else if (question.type === 'multiple') {
        // For multiple choice, all correct options must be selected and no incorrect ones
        const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt.text);
        const selectedAnswers = Array.isArray(answer.selectedAnswer) ? answer.selectedAnswer : [answer.selectedAnswer];
        
        // Check if selected answers match correct answers exactly
        isCorrect = 
          correctOptions.length === selectedAnswers.length && 
          correctOptions.every(opt => selectedAnswers.includes(opt));
      } else if (question.type === 'text') {
        // For text input, compare with accepted answers (case insensitive)
        const correctAnswer = question.options.find(opt => opt.isCorrect).text.toLowerCase();
        isCorrect = answer.selectedAnswer.toLowerCase() === correctAnswer;
      }
      
      // Award points if correct
      if (isCorrect) {
        pointsEarned = question.points;
        score += pointsEarned;
      }
      
      processedAnswers.push({
        questionId: question._id,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        pointsEarned
      });
    }
    
    // Create attempt record
    const attempt = new Attempt({
      userId: req.userId,
      quizId,
      score,
      maxScore,
      completedAt: new Date(),
      answers: processedAnswers
    });
    
    const savedAttempt = await attempt.save();
    
    // Update quiz attempt count
    quiz.totalAttempts += 1;
    await quiz.save();
    
    res.json({
      message: 'Quiz submitted successfully',
      attempt: {
        id: savedAttempt._id,
        score,
        maxScore,
        percentage: (score / maxScore) * 100,
        passed: (score / maxScore) * 100 >= quiz.passScore
      }
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error submitting quiz' });
  }
};

// Get user's quiz attempt details
exports.getQuizAttemptById = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('quizId', 'title passScore')
      .populate('answers.questionId');
    
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    
    // Only allow the user who made the attempt or an admin to view it
    if (attempt.userId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({ attempt });
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ message: 'Server error fetching attempt' });
  }
};

// Get all attempts for a user
exports.getUserAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ userId: req.userId })
      .populate('quizId', 'title category difficulty')
      .select('-answers')
      .sort({ createdAt: -1 });
    
    res.json({ attempts });
  } catch (error) {
    console.error('Get user attempts error:', error);
    res.status(500).json({ message: 'Server error fetching attempts' });
  }
};
