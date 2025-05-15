const mongoose = require('mongoose');
const Attempt = require('../models/attempt.model');
const Quiz = require('../models/quiz.model');
const Question = require('../models/question.model');
const User = require('../models/user.model');

/**
 * Start a new quiz attempt
 * @route POST /api/attempts/start
 * @access Private
 */
exports.startAttempt = async (req, res) => {
  try {
    const { quizId } = req.body;
    
    // Validate quiz ID format
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid quiz ID format' 
      });
    }
    
    // Validate quiz exists and is active
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ 
        success: false,
        message: 'Quiz not found' 
      });
    }
    
    if (!quiz.isActive && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'This quiz is not active' 
      });
    }
    
    // Check if user already has an incomplete attempt for this quiz
    const existingAttempt = await Attempt.findOne({
      user: req.user.id,
      quiz: quizId,
      completedAt: null
    });
    
    if (existingAttempt) {
      return res.status(200).json({ 
        success: true,
        message: 'Continuing existing attempt', 
        attempt: existingAttempt 
      });
    }
    
    // Get total possible score
    const questions = await Question.find({ quizId });
    const maxScore = questions.reduce((total, q) => total + q.points, 0);
    
    // Create new attempt
    const attempt = new Attempt({
      user: req.user.id,
      quiz: quizId,
      maxScore,
      startedAt: new Date(),
      answers: []
    });
    
    const savedAttempt = await attempt.save();
    
    // Increment quiz's totalAttempts count
    await Quiz.findByIdAndUpdate(quizId, { 
      $inc: { totalAttempts: 1 } 
    });
    
    res.status(201).json({
      success: true,
      message: 'Quiz attempt started',
      attempt: savedAttempt
    });
  } catch (error) {
    console.error('Start attempt error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during attempt creation',
      error: error.message
    });
  }
};

/**
 * Submit answer for a question
 * @route POST /api/attempts/answer
 * @access Private
 */
exports.submitAnswer = async (req, res) => {
  try {
    const { attemptId, questionId, selectedAnswer } = req.body;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(attemptId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid ID format for attempt or question' 
      });
    }
    
    // Find attempt
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ 
        success: false,
        message: 'Attempt not found' 
      });
    }
    
    // Verify user owns this attempt
    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to submit to this attempt' 
      });
    }
    
    // Check if attempt is already completed
    if (attempt.completedAt) {
      return res.status(400).json({ 
        success: false,
        message: 'This attempt is already completed' 
      });
    }
    
    // Find question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ 
        success: false,
        message: 'Question not found' 
      });
    }
    
    // Check if answer already exists for this question
    const existingAnswerIndex = attempt.answers.findIndex(
      a => a.questionId.toString() === questionId
    );
    
    let isCorrect = false;
    let pointsEarned = 0;
    
    // Evaluate answer correctness based on question type
    switch (question.type) {
      case 'multiple':
        // Multiple choice (multiple answers)
        if (Array.isArray(selectedAnswer)) {
          const correctOptions = question.options.filter(o => o.isCorrect).map(o => o._id.toString());
          const selectedOptions = selectedAnswer.map(id => id.toString());
          
          // Check if selected options match exactly with correct options
          isCorrect = correctOptions.length === selectedOptions.length &&
                      correctOptions.every(id => selectedOptions.includes(id));
        }
        break;
        
      case 'single':
        // Single choice
        const correctOption = question.options.find(o => o.isCorrect);
        isCorrect = correctOption && correctOption._id.toString() === selectedAnswer.toString();
        break;
        
      case 'truefalse':
        // True/False question
        isCorrect = selectedAnswer === question.options.find(o => o.isCorrect).text;
        break;
        
      case 'text':
        // Text input question - case insensitive match
        const correctText = question.options.find(o => o.isCorrect).text.toLowerCase();
        isCorrect = selectedAnswer.toLowerCase() === correctText;
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: `Unsupported question type: ${question.type}`
        });
    }
    
    // Calculate points
    pointsEarned = isCorrect ? question.points : 0;
    
    // Update or add the answer
    const answer = {
      questionId,
      selectedAnswer,
      isCorrect,
      pointsEarned,
      answeredAt: new Date()
    };
    
    if (existingAnswerIndex >= 0) {
      // Update existing answer
      const oldPoints = attempt.answers[existingAnswerIndex].pointsEarned || 0;
      attempt.score = (attempt.score || 0) - oldPoints + pointsEarned;
      attempt.answers[existingAnswerIndex] = answer;
    } else {
      // Add new answer
      attempt.answers.push(answer);
      attempt.score = (attempt.score || 0) + pointsEarned;
    }
    
    const updatedAttempt = await attempt.save();
    
    res.json({
      success: true,
      message: 'Answer submitted successfully',
      answer,
      currentScore: updatedAttempt.score
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during answer submission',
      error: error.message
    });
  }
};

/**
 * Complete a quiz attempt
 * @route POST /api/attempts/:attemptId/complete
 * @access Private
 */
exports.completeAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { timeTaken } = req.body; 
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid attempt ID format' 
      });
    }
    
    // Find attempt
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ 
        success: false,
        message: 'Attempt not found' 
      });
    }
    
    // Verify user owns this attempt
    if (attempt.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to complete this attempt' 
      });
    }
    
    // Check if attempt is already completed
    if (attempt.completedAt) {
      return res.status(400).json({ 
        success: false,
        message: 'This attempt is already completed' 
      });
    }
    
    // Mark as completed and record time if provided
    attempt.completedAt = new Date();
    if (timeTaken) {
      attempt.timeTaken = timeTaken;
    } else {
      // Calculate time taken based on startedAt
      const endTime = new Date();
      const startTime = new Date(attempt.startedAt);
      attempt.timeTaken = Math.round((endTime - startTime) / 1000); // in seconds
    }
    
    // Get quiz pass score
    const quiz = await Quiz.findById(attempt.quiz);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz associated with this attempt not found'
      });
    }
    
    const isPassed = attempt.score >= quiz.passScore;
    const completedAttempt = await attempt.save();
    
    res.json({
      success: true,
      message: 'Quiz attempt completed',
      attempt: completedAttempt,
      isPassed,
      passScore: quiz.passScore
    });
  } catch (error) {
    console.error('Complete attempt error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during attempt completion',
      error: error.message
    });
  }
};

/**
 * Get attempts by the current user with filtering options
 * @route GET /api/attempts/user
 * @access Private
 */
exports.getUserAttempts = async (req, res) => {
  try {
    const { 
      category, 
      quiz, 
      status, 
      sortBy = 'startedAt', 
      sortOrder = 'desc' 
    } = req.query;

    // Build base query
    const query = { user: req.user };

    // Validate and add quiz filter
    if (quiz) {
      if (!mongoose.Types.ObjectId.isValid(quiz)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid quiz ID format'
        });
      }
      query.quiz = quiz;
    }

    // Add category filter
    if (category) {
      const categoryQuizzes = await Quiz.find({ category });
      
      if (categoryQuizzes.length === 0) {
        return res.json({
          success: true,
          attempts: []
        });
      }
      
      const quizIds = categoryQuizzes.map(q => q._id);
      query.quiz = { $in: quizIds };
    }

    // Add status filter
    if (status === 'completed') {
      query.completedAt = { $ne: null };
    } else if (status === 'inProgress') {
      query.completedAt = null;
    }

    // Handle nested sorting (e.g., quiz.title)
    if (sortBy.includes('.')) {
      const [parentField, childField] = sortBy.split('.');

      const lookupStage = {
        $lookup: {
          from: parentField === 'quiz' ? 'quizzes' : `${parentField}s`,
          localField: parentField,
          foreignField: '_id',
          as: `${parentField}Data`
        }
      };

      const unwindStage = {
        $unwind: {
          path: `$${parentField}Data`,
          preserveNullAndEmptyArrays: true
        }
      };

      const matchStage = { $match: query };

      const sortStage = {
        $sort: {
          [`${parentField}Data.${childField}`]: sortOrder === 'asc' ? 1 : -1
        }
      };

      const attempts = await Attempt.aggregate([
        matchStage,
        lookupStage,
        unwindStage,
        sortStage
      ]);

      // Populate necessary fields after aggregation
      const populatedAttempts = await Attempt.populate(attempts, [
        {
          path: 'quiz',
          select: 'title category difficulty timeLimit passScore'
        },
        {
          path: 'user',
          select: 'name email'
        }
      ]);

      return res.json({
        success: true,
        attempts: populatedAttempts
      });
    }

    // Regular sorting for non-nested fields
    const attempts = await Attempt.find(query)
      .populate('quiz', 'title category difficulty timeLimit passScore')
      .select('-answers.selectedAnswer')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    res.json({
      success: true,
      attempts
    });

  } catch (error) {
    console.error('Get user attempts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching attempts',
      error: error.message
    });
  }
};

/**
 * Get all attempts (admin only)
 * @route GET /api/attempts/all
 * @access Admin
 */
exports.getAllAttempts = async (req, res) => {
  try {
    // Check for admin role
  
    
    const { category, user, quiz, status, sortBy = 'startedAt', sortOrder = 'desc' } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    // Build query based on filters
    const query = {};
    
    // Add user filter if provided
    if (user && mongoose.Types.ObjectId.isValid(user)) {
      query.user = user;
    }
    
    // Add quiz filter if provided
    if (quiz && mongoose.Types.ObjectId.isValid(quiz)) {
      query.quiz = quiz;
    }
    
    // Add category filter if provided
    if (category) {
      const categoryQuizzes = await Quiz.find({ category });
      const quizIds = categoryQuizzes.map(q => q._id);
      query.quiz = { $in: quizIds };
    }
    
    // Add status filter if provided
    if (status === 'completed') {
      query.completedAt = { $ne: null };
    } else if (status === 'inProgress') {
      query.completedAt = null;
    }
    
    // Determine sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const attempts = await Attempt.find(query)
        .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'quiz',
        select: 'title category difficulty'
      })
      .limit(limit)
      .sort(sort)
      .lean();
      
    
    res.status(200).json({ 
      success: true,
      attempts 
    });
  } catch (error) {
    console.error('Error getting all attempts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch attempts', 
      error: error.message 
    });
  }
};

exports.getRecentAttempts = async (req, res) => {
  try {
    const {quizId} = req.params.id;
    const limit = parseInt(req.query.limit) || 10;

    // Verify the quiz ID is valid
    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }

    const attempts = await Attempt.find({ quiz: quizId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({
        path: 'user',  // Using 'user' instead of 'userId'
        select: 'name email',
        model: 'User',
        strictPopulate: false
      });

    const formattedAttempts = attempts.map(attempt => {
      // Calculate percentage score and round to 2 decimal places
      const percentageScore = attempt.maxScore > 0 
        ? (attempt.score / attempt.maxScore) * 100 
        : 0;

      // Calculate time taken in seconds
      const timeTaken = attempt.completedAt && attempt.startedAt
        ? Math.floor((new Date(attempt.completedAt) - new Date(attempt.startedAt)) / 1000)
        : null;

      return {
        _id: attempt._id,  // Fixed property name (removed extra underscore)
        score: Math.round(percentageScore), // Rounding to whole number
        timeTaken,
        createdAt: attempt.createdAt,
        user: attempt.user
          ? { name: attempt.user.name, email: attempt.user.email }
          : null,
      };
    });

    return res.json({ 
      success: true,
      attempts: formattedAttempts,
      count: formattedAttempts.length
    });
  } catch (err) {
    console.error('Error fetching attempts:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching quiz attempts', 
      error: process.env.NODE_ENV === 'production' ? null : err.message 
    });
  }
};
/**
 * Get quiz statistics
 * @route GET /api/attempts/stats/:quizId
 * @access Private/Quiz Creator or Admin
 */
exports.getQuizStats = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quiz ID format'
      });
    }
    
    // Verify quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Check authorization for non-public stats
    const isAuthorized = req.user.role === 'admin' || 
                         (quiz.createdBy && quiz.createdBy.toString() === req.user.id);
    
    // Get basic stats
    const totalAttempts = await Attempt.countDocuments({ quiz: quizId });
    const completedAttempts = await Attempt.countDocuments({ 
      quiz: quizId, 
      completedAt: { $ne: null } 
    });
    
    // Get average score from completed attempts
    const avgScoreResult = await Attempt.aggregate([
      { $match: { quiz: new mongoose.Types.ObjectId(quizId), completedAt: { $ne: null } } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    
    const avgScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore * 10) / 10 : 0;
    
    // Get pass rate
    const passedAttempts = await Attempt.countDocuments({
      quiz: quizId,
      completedAt: { $ne: null },
      score: { $gte: quiz.passScore }
    });
    
    const passRate = completedAttempts > 0 
      ? Math.round((passedAttempts / completedAttempts) * 1000) / 10 
      : 0;
    
    // Get average time taken
    const avgTimeResult = await Attempt.aggregate([
      { $match: { quiz: new mongoose.Types.ObjectId(quizId), completedAt: { $ne: null }, timeTaken: { $exists: true } } },
      { $group: { _id: null, avgTime: { $avg: '$timeTaken' } } }
    ]);
    
    const avgTime = avgTimeResult.length > 0 ? Math.round(avgTimeResult[0].avgTime) : 0;
    
    // Get question performance if authorized
    let questionStats = [];
    if (isAuthorized) {
      const questions = await Question.find({ quizId });
      
      for (const question of questions) {
        const attemptsWithQuestion = await Attempt.find({
          quiz: quizId,
          'answers.questionId': question._id
        });
        
        const answersForQuestion = attemptsWithQuestion.flatMap(a => 
          a.answers.filter(ans => ans.questionId.toString() === question._id.toString())
        );
        
        const correctAnswers = answersForQuestion.filter(a => a.isCorrect).length;
        const totalAnswers = answersForQuestion.length;
        
        questionStats.push({
          questionId: question._id,
          text: question.text.substring(0, 50) + (question.text.length > 50 ? '...' : ''),
          correctRate: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 1000) / 10 : 0,
          attemptsCount: totalAnswers
        });
      }
      
      // Sort question stats by correct rate (ascending)
      questionStats.sort((a, b) => a.correctRate - b.correctRate);
    }
    
    res.json({
      success: true,
      stats: {
        totalAttempts,
        completedAttempts,
        avgScore,
        passRate,
        avgTimeTaken: avgTime,
        passedCount: passedAttempts,
        questionStats: isAuthorized ? questionStats : undefined
      }
    });
  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quiz statistics',
      error: error.message
    });
  }
};

/**
 * Get attempt by ID with detailed information
 * @route GET /api/attempts/:id
 * @access Private/Owner or Admin
 */
exports.getAttemptById = async (req, res, next) => {
  try {
    // Find the attempt by ID
    const attempt = await Attempt.findById(req.params.id)
      .populate('user', 'name email')
      .populate('quiz')
      .exec();

    if (!attempt) {
      return res.status(404).json({ 
        success: false, 
        message: 'Attempt not found' 
      });
    }

    // Get all questions for this quiz
    const questions = await Question.find({ quizId: attempt.quiz._id }).exec();
    
    // Prepare the response object
    const responseData = {
      success: true,
      attempt: {
        ...attempt.toObject(),
        quiz: {
          ...attempt.quiz.toObject(),
          questions: questions
        }
      }
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error in getAttemptById:', error);
    next(error);
  }
};

/**
 * Delete an attempt
 * @route DELETE /api/attempts/:id
 * @access Private/Admin
 */
exports.deleteAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attempt ID format'
      });
    }
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete attempts'
      });
    }
    
    const attempt = await Attempt.findById(id);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }
    
    await Attempt.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Attempt deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attempt',
      error: error.message
    });
  }
};

// GET /api/attempts/user
exports.getAttemptsByUser = async (req, res) => {
  try {
    const userId = req.userId;
    const attempts = await Attempt.find({ user: userId })
      .populate('quiz', 'title')
      .sort({ createdAt: -1 });
    res.status(200).json({ attempts });
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
