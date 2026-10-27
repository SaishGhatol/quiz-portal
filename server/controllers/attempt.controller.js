const mongoose = require('mongoose');
const Attempt = require('../models/attempt.model');
const Quiz = require('../models/quiz.model');

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
    if (req.userRole !== 'admin') {
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
