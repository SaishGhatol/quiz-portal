const mongoose = require('mongoose');
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
      createdBy: req.user
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

exports.getAllQuizzes = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      search = '', 
      category = '',     // ADD THIS
      difficulty = '',   // ADD THIS
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;

    // Create query object
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter - ADD THIS
    if (category) {
      query.category = category;
    }
    
    // Difficulty filter - ADD THIS
    if (difficulty) {
  query.difficulty = { $regex: new RegExp(`^${difficulty}$`, 'i') };
}

    
    // Debug logging (remove in production)
    console.log('Query filters:', {
      search,
      category,
      difficulty,
      finalQuery: query
    });

    // Set sort order
    const sort = {};
    sort[sortBy] = order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Quiz.countDocuments(query);

    // Debug logging (remove in production)
    console.log('Results:', {
      totalFound: total,
      returnedCount: quizzes.length
    });

    // Format response to match what frontend expects
    res.status(200).json({
      quizzes,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    next(error);
  }
};


// Get quiz by ID with questions
exports.getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }

    const quiz = await Quiz.findById(id).populate('createdBy', 'name');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Fetch all questions with complete details for all users
    const questions = await Question.find({ quizId: quiz._id });

    // Return complete question and option details for all users
    res.json({
      quiz,
      questions: questions.map(q => ({
        ...q._doc,
        options: q.options.map(opt => ({
          _id: opt._id,
          text: opt.text,
          isCorrect: opt.isCorrect // Include isCorrect for all users
        }))
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
    await Quiz.findByIdAndDelete(quiz._id);
    
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error deleting quiz' });
  }
};

exports.submitQuizAttempt = async (req, res) => {
  try {
    // Extract quiz ID from route parameters and answers from request body
    const { id: quizId } = req.params;
    const { answers, startedAt, completedAt } = req.body;
    
    // Enhanced logging for debugging time issues
    console.log('Quiz submission received:', {
      quizId,
      userId: req.userId,
      answersCount: answers?.length,
      startedAt: startedAt || 'MISSING',
      completedAt: completedAt || 'MISSING'
    });
    
    // Validate required inputs
    if (!quizId) {
      return res.status(400).json({ message: 'Quiz ID is required' });
    }
    
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers are required and must be an array' });
    }
    
    // Handle missing time values
    let validStartedAt, validCompletedAt;
    
    try {
      // Try to create valid Date objects
      validStartedAt = startedAt ? new Date(startedAt) : null;
      validCompletedAt = completedAt ? new Date(completedAt) : new Date();
      
      // Validate the date objects
      if (validStartedAt && isNaN(validStartedAt.getTime())) {
        console.warn('Invalid startedAt date received:', startedAt);
        validStartedAt = new Date(Date.now() - 1000 * 60 * 10); // Default to 10 minutes ago
      }
      
      if (isNaN(validCompletedAt.getTime())) {
        console.warn('Invalid completedAt date received:', completedAt);
        validCompletedAt = new Date();
      }
      
      // If startedAt is missing or invalid, set a reasonable default
      if (!validStartedAt) {
        console.warn('Missing startedAt date, setting default');
        validStartedAt = new Date(validCompletedAt.getTime() - 1000 * 60 * 10); // Default to 10 minutes before completion
      }
      
      // Sanity check: make sure startedAt is before completedAt
      if (validStartedAt > validCompletedAt) {
        console.warn('startedAt is after completedAt, swapping values');
        [validStartedAt, validCompletedAt] = [validCompletedAt, validStartedAt];
      }
      
      console.log('Validated time values:', {
        validStartedAt: validStartedAt.toISOString(),
        validCompletedAt: validCompletedAt.toISOString()
      });
    } catch (error) {
      console.error('Error processing date values:', error);
      validStartedAt = new Date(Date.now() - 1000 * 60 * 10); // 10 minutes ago
      validCompletedAt = new Date();
    }
    
    // Find the quiz by ID
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Get all questions for this quiz
    const questions = await Question.find({ quizId });
    if (!questions.length) {
      return res.status(404).json({ message: 'No questions found for this quiz' });
    }
    
    // Process answers and calculate score
    let score = 0;
    let maxScore = 0;
    const processedAnswers = [];
    
    // Process each question
    for (const question of questions) {
      const userAnswer = answers.find(a => a.questionId === question._id.toString());
      maxScore += question.points;
      
      // Default values for unanswered questions
      let selectedAnswer = '';
      let isCorrect = false;
      let pointsEarned = 0;
      
      // If user answered this question
      if (userAnswer && userAnswer.selectedOptionId) {
        const selectedOption = question.options.find(
          o => o._id.toString() === userAnswer.selectedOptionId
        );
        
        if (selectedOption) {
          selectedAnswer = selectedOption.text;
          isCorrect = selectedOption.isCorrect === true;
          pointsEarned = isCorrect ? question.points : 0;
          score += pointsEarned;
        }
      }
      
      processedAnswers.push({
        questionId: question._id,
        selectedAnswer,
        isCorrect,
        pointsEarned
      });
    }
    
    // Create the attempt with validated date values
    const attempt = await Attempt.create({
      user: req.userId,
      quiz: quizId,
      score,
      maxScore,
      startedAt: validStartedAt,
      completedAt: validCompletedAt,
      answers: processedAnswers
    });
    
    // Make sure created attempt has the time values
    console.log('Created attempt time values:', {
      attemptId: attempt._id,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt
    });
    
    // Update quiz statistics
    quiz.totalAttempts += 1;
    await quiz.save();
    
    // Return success response
    return res.status(201).json({
      message: 'Quiz submitted successfully',
      attemptId: attempt._id,
      score,
      maxScore,
      percentageScore: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    
    // Log more detailed error information for debugging
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', JSON.stringify(error.errors));
      return res.status(400).json({
        message: 'Validation error',
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: `Invalid ${error.path}: ${error.value}` });
    }
    
    // General server error
    return res.status(500).json({
      message: 'Server error submitting quiz',
      error: error.message
    });
  }
};

exports.getQuizAttemptById = async (req, res) => {
  try {
    // Fetch the attempt with populated user and quiz fields
    const attempt = await Attempt.findById(req.params.id)
      .populate('quiz')
      .populate('user');
    
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    
    // Fetch all questions for this quiz
    const questions = await Question.find({ quizId: attempt.quiz._id });
    
    // Prepare response with all the data frontend needs
    const responseData = {
      attempt: {
        ...attempt._doc,
        // Ensure answers have complete information
        answers: attempt.answers.map(answer => {
          // Find matching question for this answer
          const question = questions.find(q => 
            q._id.toString() === answer.questionId.toString()
          );
          
          return {
            ...answer._doc,
            question: question ? {
              _id: question._id,
              text: question.text,
              options: question.options.map(opt => ({
                _id: opt._id,
                text: opt.text,
                isCorrect: opt.isCorrect
              }))
            } : null
          };
        })
      },
      quiz: {
        ...attempt.quiz._doc,
        questions
      }
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ message: 'Server error fetching attempt details' });
  }
};
// Get all attempts for a user
exports.getUserAttempts = async (req, res) => {
  try {
    // Option 1: Rename the populated field to match frontend expectations
    const attempts = await Attempt.find({ user: req.userId }) 
      .populate('quizId', 'title category difficulty')  // Change 'quiz' to 'quizId' if that's your schema field
      .select('-answers')
      .sort({ createdAt: -1 });
    
    res.json({ attempts });

    // Option 2 (Alternative): Keep the backend as is but transform data
    /*
    const attempts = await Attempt.find({ user: req.userId }) 
      .populate('quiz', 'title category difficulty')
      .select('-answers')
      .sort({ createdAt: -1 });
    
    // Transform data to match frontend expectations
    const transformedAttempts = attempts.map(attempt => {
      const attemptObj = attempt.toObject();
      // Rename quiz to quizId for frontend compatibility
      attemptObj.quizId = attemptObj.quiz;
      delete attemptObj.quiz;
      return attemptObj;
    });
    
    res.json({ attempts: transformedAttempts });
    */
  } catch (error) {
    console.error('Get user attempts error:', error);
    res.status(500).json({ message: 'Server error fetching attempts' });
  }
};

exports.getQuizStatistics = async (req, res) => {
  try {

    if (!req.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const quizId = await Quiz.findById(req.params.id);
    
    // Check if quiz exists
    if (!quizId) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const attempts = await Attempt.find({ quiz: req.params.id });

    if (!attempts.length) {
      return res.json({
        statistics: {
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0,
          uniqueUsers: 0,
          questionStats: [],
        },
      });
    }

    const totalAttempts = attempts.length;
    const averageScore =
      attempts.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / totalAttempts;

    const passRate =
      (attempts.filter((a) => (a.score / a.maxScore) * 100 >= 40).length / totalAttempts) * 100;

    const uniqueUsers = new Set(attempts.map((a) => a.user?.toString()).filter(Boolean)).size;

    // Fetch questions separately since they're stored in their own collection
    const questions = await Question.find({ quizId: req.params.id });

    const questionStats = questions.map((q) => {
      const stats = {
        text: q.text,
        correctCount: 0,
        totalAttempts: 0,
        successRate: 0,
      };

      attempts.forEach((attempt) => {
        if (attempt.answers) {
          const answer = attempt.answers.find(
            (ans) => ans.questionId && ans.questionId.toString() === q._id.toString()
          );
          if (answer) {
            stats.totalAttempts++;
            if (answer.isCorrect) stats.correctCount++;
          }
        }
      });

      stats.successRate =
        stats.totalAttempts > 0
          ? (stats.correctCount / stats.totalAttempts) * 100
          : 0;

      return stats;
    });

    res.json({
      statistics: {
        totalAttempts,
        averageScore,
        passRate,
        uniqueUsers,
        questionStats,
      },
    });
  } catch (err) {
    console.error("Error calculating statistics:", err);
    res.status(500).json({ message: "Error calculating statistics", error: err.message });
  }
};
exports.getRecentAttemptsByQuizId = async (req, res) => {
  try {
    const quizId = req.params.id;
    const limit = parseInt(req.query.limit) || 10;

    const attempts = await Attempt.find({ quiz: quizId }) 
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name email'); 
    const formattedAttempts = attempts.map(attempt => {
      const percentageScore = (attempt.score / attempt.maxScore) * 100;

      const timeTaken =
        attempt.completedAt && attempt.startedAt
          ? Math.floor((new Date(attempt.completedAt) - new Date(attempt.startedAt)) / 1000)
          : null;

      return {
        _id: attempt._id,
        score: Math.round(percentageScore),
        timeTaken,
        createdAt: attempt.createdAt,
        user: attempt.user
          ? { name: attempt.user.name, email: attempt.user.email }
          : null,
      };
    });

    res.json({ attempts: formattedAttempts });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attempts', error: err.message });
  }
};

