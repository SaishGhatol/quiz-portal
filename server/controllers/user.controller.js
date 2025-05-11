const Quiz = require('../models/quiz.model');
const Attempt = require('../models/attempt.model');

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.userId; // set by auth middleware

    // Count total active quizzes
    const totalQuizzes = await Quiz.countDocuments();

    // Count user attempts
    const totalAttempts = await Attempt.countDocuments({ userId });

    // Get recent completed quizzes
    const completedAttempts = await Attempt.find({ userId })
      .populate('quiz', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const completedQuizzes = completedAttempts.map(attempt => ({
      _id: attempt.quiz?._id,
      title: attempt.quiz?.title,
      score: attempt.score,
      completedAt: attempt.completedAt || attempt.createdAt,
      attemptId: attempt._id
    }));

    // Simulate recent activity
    const recentActivity = completedQuizzes.map(q => ({
      type: 'quiz_completed',
      message: `Completed "${q.title}"`,
      timestamp: q.completedAt
    }));

    res.json({
      totalQuizzes,
      totalAttempts,
      completedQuizzes,
      recentActivity
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error loading dashboard' });
  }
};
