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
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }

    const quiz = await Quiz.findById(id).populate('createdBy', 'name');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (req.userRole !== 'admin' && !quiz.isActive) {
      return res.status(403).json({ message: 'This quiz is not currently available' });
    }

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
    await Quiz.findByIdAndDelete(quiz._id);
    
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error deleting quiz' });
  }
};

// Submit quiz attempt
exports.submitQuizAttempt = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers are required' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const questions = await Question.find({ quizId });

    let score = 0;
    let maxScore = 0;
    const processedAnswers = [];

    for (const question of questions) {
      const userAnswer = answers.find(a => a.questionId === question._id.toString());
      maxScore += question.points;

      if (!userAnswer) continue;

      const correctOptions = question.options.filter(o => o.isCorrect).map(o => o.text);
      const selectedOption = question.options.find(o => o._id.toString() === userAnswer.selectedOptionId);

      let isCorrect = false;
      if (selectedOption && correctOptions.includes(selectedOption.text)) {
        score += question.points;
        isCorrect = true;
      }

      processedAnswers.push({
        questionId: question._id,
        selectedAnswer: selectedOption?.text,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0
      });
    }

    const Attempt = require('../models/attempt.model');
    const attempt = await Attempt.create({
      userId: req.userId,
      quizId,
      score,
      maxScore,
      completedAt: new Date(),
      answers: processedAnswers
    });

    quiz.totalAttempts += 1;
    await quiz.save();

    res.status(201).json({
      message: 'Quiz submitted successfully',
      attemptId: attempt._id,
      score,
      maxScore
    });

  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error submitting quiz' });
  }
};

// Get user's quiz attempt details
exports.getQuizAttemptById = async (req, res) => {
  try {
    const quizId = req.params.id;
    
    // Special case for 'all'
    if (quizId === 'all') {
      const quizzes = await Quiz.find({})
        .populate('author', 'name email')
        .exec();
      return res.status(200).json({ success: true, quizzes });
    }
    
    // Regular case for specific quiz ID
    const quiz = await Quiz.findById(quizId)
      .populate('author', 'name email')
      .exec();
    
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    
    res.status(200).json({ success: true, quiz });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ success: false, message: error.message });
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

const getQuizStatistics = async (req, res) => {
  try {
    const quizId = req.params.id;

    // ✅ Correct field: 'quiz', not 'quizId'
    const attempts = await Attempt.find({ quiz: quizId });

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

    const uniqueUsers = new Set(attempts.map((a) => a.userId.toString())).size;

    const quiz = await mongoose.model("Quiz").findById(quizId);

    const questionStats = quiz.questions.map((q) => {
      const stats = {
        text: q.text,
        correctCount: 0,
        totalAttempts: 0,
        successRate: 0,
      };

      attempts.forEach((attempt) => {
        const answer = attempt.answers.find(
          (ans) => ans.questionId.toString() === q._id.toString()
        );
        if (answer) {
          stats.totalAttempts++;
          if (answer.isCorrect) stats.correctCount++;
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

const getRecentAttemptsByQuizId = async (req, res) => {
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
module.exports = {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  submitQuizAttempt,
  getQuizAttemptById,
  getUserAttempts,
  getQuizStatistics,
  getRecentAttemptsByQuizId,
};