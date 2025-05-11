// server/controllers/admin.controller.js
const mongoose = require('mongoose');
const Quiz = require('../models/quiz.model');
const User = require('../models/user.model');
const Attempt = require('../models/attempt.model');
const Question = require('../models/question.model');

exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get counts from each collection
    const [totalQuizzes, totalUsers, totalAttempts, activeUsersCount] = await Promise.all([
      Quiz.countDocuments(),
       User.countDocuments(),
      Attempt.countDocuments(),
      // Active users defined as users who logged in within the last 30 days
      User.countDocuments({
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    res.status(200).json({
      totalQuizzes,
      totalUsers,
      totalAttempts,
      activeUsers: activeUsersCount
    });
  } catch (error) {
    next(error);
  }
};
exports.createQuiz = async (req, res) => {
  try {
    // Log the incoming request data for debugging
    console.log('Create quiz request body:', req.body);
    console.log('User from request:', req.userId);
    
    const { title, description, category, difficulty, timeLimit, passScore, isPublished } = req.body;
    
    
    const quiz = new Quiz({
      title,
      description,
      category,
      difficulty,
      timeLimit,
      passScore,
      isPublished: isPublished || false, // Adding isPublished field with default
      createdBy: req.userId  // Make sure we're using _id explicitly
    });
    
    const savedQuiz = await quiz.save();
    res.status(201).json({
      message: 'Quiz created successfully',
      quiz: savedQuiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    // Provide more detailed error message to client
    res.status(500).json({ 
      message: 'Server error creating quiz',
      details: error.message 
    });
  }
};
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc' } = req.query;

    // Create query object
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Set sort order
    const sort = {};
    sort[sortBy] = order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // For each user, get their quiz attempt count
    const enhancedUsers = await Promise.all(users.map(async (user) => {
      const attemptCount = await Attempt.countDocuments({ user: user._id });
      return {
        ...user._doc,
        attemptCount
      };
    }));

    res.status(200).json({
      users: enhancedUsers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};
exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Check if userId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's attempts
    const attempts = await Attempt.find({ user: userId })
      .populate('quiz', 'title')
      .sort({ completedAt: -1 })
      .limit(10);

    res.status(200).json({
      user,
      attempts
    });
  } catch (error) {
    next(error);
  }
};
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // For safety, prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    await User.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
exports.getAllAttempts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'completedAt', order = 'desc' } = req.query;

    // Create query object
    const query = {};
    if (search) {
      // If searching, we need to find users and quizzes matching the search term first
      const users = await User.find({ name: { $regex: search, $options: 'i' } });
      const quizzes = await Quiz.find({ title: { $regex: search, $options: 'i' } });

      const userIds = users.map(user => user._id);
      const quizIds = quizzes.map(quiz => quiz._id);

      if (userIds.length > 0 || quizIds.length > 0) {
        query.$or = [];

        if (userIds.length > 0) {
          query.$or.push({ user: { $in: userIds } });
        }

        if (quizIds.length > 0) {
          query.$or.push({ quiz: { $in: quizIds } });
        }
      }
    }

    // Set sort order
    const sort = {};
    sort[sortBy] = order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const attempts = await Attempt.find(query)
      .populate('user', 'name email') // FIXED
      .populate('quiz', 'title')      // FIXED
      .sort(sort)
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Attempt.countDocuments(query);

    res.status(200).json({
      attempts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};
exports.getAttemptById = async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('user', 'name email')
      .populate('quiz', 'title description')
      .populate('answers.question')
      .exec();

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    res.status(200).json({ attempt });
  } catch (error) {
    next(error);
  }
};
exports.getQuizById = async (req, res, next) => {
  try {
    // Handle special cases
    if (req.params.id === "recent") {
      const recentQuizzes = await Quiz.find()
        .sort({ createdAt: -1 })
        .limit(1);

      if (recentQuizzes.length === 0) {
        return res.status(404).json({ message: 'No quizzes found' });
      }

      return res.status(200).json({ quiz: recentQuizzes[0] });
    }
    
    // Handle "attempts" special case
    if (req.params.id === "attempts") {
      // Depending on what you want to achieve with "attempts", implement appropriate logic
      // For example, if you want to get quizzes with most attempts:
      const quizzesWithAttempts = await Quiz.find()
        .sort({ attemptCount: -1 }) // Assuming you have an attemptCount field
        .limit(10);
        
      return res.status(200).json({ quizzes: quizzesWithAttempts });
    }

    // Regular case - find by ID
    // Validate that the ID is a valid ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid quiz ID format' });
    }
    
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    res.status(200).json({ quiz });
  } catch (error) {
    next(error);
  }
};
exports.getRecentAttempts = async (req, res) => {
  try {
    const quizId = req.params.id;
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
exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find();
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
};
exports.getQuizQuestions = async (req, res, next) => {
  try {
    const quizId = req.params.id;
    const questions = await Question.find({ quizId });
    res.status(200).json(questions);
  } catch (error) {
    next(error);
  }
};
exports.addQuestion = async (req, res, next) => {
  try {
    const quizId = req.params.id;
    const { text, options, correctOption } = req.body;
    const question = new Question({ quizId, text, options, correctOption });
    await question.save();
    res.status(201).json(question);
  } catch (error) {
    next(error);
  }
};
exports.updateQuestion = async (req, res, next) => {
  try {
    const quizId = req.params.id;
    const questionId = req.params.questionId;
    const { text, options, correctOption } = req.body;
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    question.text = text;
    question.options = options;
    question.correctOption = correctOption;
    await question.save();
    res.status(200).json(question);
  } catch (error) {
    next(error);
  }
};
exports.reorderQuestion = async (req, res, next) => {
  try {
    const { id: quizId, questionId } = req.params;
    const { newPosition } = req.body;

    // Find the quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Find the question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Update the question's position
    // This implementation depends on how you're storing question order
    // Assuming you might have an 'order' field in your Question model
    question.order = newPosition;
    await question.save();

    res.status(200).json({
      message: 'Question reordered successfully',
      question
    });
  } catch (error) {
    next(error);
  }
};
exports.getAllQuizzes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc' } = req.query;

    // Create query object
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Set sort order
    const sort = {};
    sort[sortBy] = order === 'asc' ? 1 : -1;

    // Execute query with pagination
    const quizzes = await Quiz.find(query)
      .populate('createdBy', 'name email') // Fixed populate to specify the field and what to populate
      .sort(sort)
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .exec();

    // Get total count for pagination
    const total = await Quiz.countDocuments(query);

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
exports.getRecentQuizzes = async (req, res, next) => {
  try {
    // Get the 10 most recent quizzes
    const quizzes = await Quiz.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    res.status(200).json({
      quizzes,
      success: true
    });
  } catch (error) {
    console.error('Error fetching recent quizzes:', error);
    next(error);
  }
};