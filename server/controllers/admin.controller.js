// server/controllers/admin.controller.js
const mongoose = require('mongoose');
const Quiz = require('../models/quiz.model');
const User = require('../models/user.model');
const Attempt = require('../models/attempt.model');
const Question = require('../models/question.model');

/**
 * Get dashboard statistics
 */
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

/**
 * Get all quizzes with pagination
 */
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
      .populate('author', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .exec();
    
    // Get total count for pagination
    const total = await Quiz.countDocuments(query);
    
    res.status(200).json({
      quizzes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific quiz by ID
 */
exports.getQuizById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('author', 'name email')
      .populate('questions')
      .exec();
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Get number of attempts for this quiz
    const attemptCount = await Attempt.countDocuments({ quiz: req.params.id });
    
    res.status(200).json({
      quiz,
      attemptCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with pagination
 */
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

/**
 * Get a specific user by ID
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's attempts
    const attempts = await Attempt.find({ user: req.params.id })
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

/**
 * Update a user
 */
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

/**
 * Delete a user
 */
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
    
    // Optional: Delete user's attempts or keep them for historical data
    // await Attempt.deleteMany({ user: req.params.id });
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all attempts with pagination
 */
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
      .populate('user', 'name email')
      .populate('quiz', 'title')
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

/**
 * Get a specific attempt by ID
 */
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
exports.getQuizStatistics = async (req, res) => {
    try {
      const quizId = req.params.id;
      const attempts = await Attempt.find({ quizId });
  
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
      const averageScore = attempts.reduce((sum, a) => sum + (a.score / a.maxScore) * 100, 0) / totalAttempts;
      const passRate = (attempts.filter(a => (a.score / a.maxScore) * 100 >= 40).length / totalAttempts) * 100;
      const uniqueUsers = new Set(attempts.map(a => a.userId.toString())).size;
  
      const quiz = await mongoose.model('Quiz').findById(quizId);
      const questionStats = quiz.questions.map(q => {
        const stats = {
          text: q.text,
          correctCount: 0,
          totalAttempts: 0,
          successRate: 0,
        };
  
        attempts.forEach(attempt => {
          const answer = attempt.answers.find(ans => ans.questionId.toString() === q._id.toString());
          if (answer) {
            stats.totalAttempts++;
            if (answer.isCorrect) stats.correctCount++;
          }
        });
  
        stats.successRate = stats.totalAttempts > 0
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
      res.status(500).json({ message: 'Error calculating statistics', error: err.message });
    }
  };
  exports.getRecentAttempts = async (req, res) => {
    try {
      const quizId = req.params.id;
      const limit = parseInt(req.query.limit) || 10;
  
      const attempts = await Attempt.find({ quizId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'name email');
  
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
          user: attempt.userId
            ? { name: attempt.userId.name, email: attempt.userId.email }
            : null,
        };
      });
  
      res.json({ attempts: formattedAttempts });
    } catch (err) {
      res.status(500).json({ message: 'Error fetching attempts', error: err.message });
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

  