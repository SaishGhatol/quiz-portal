const mongoose = require('mongoose');
const Attempt = require('../models/attempt.model');
const Quiz = require('../models/quiz.model');
const Question = require('../models/question.model');

// Start a new quiz attempt
exports.startAttempt = async (req, res) => {
  try {
    const { quizId } = req.body;
    
    // Validate quiz exists and is active
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    if (!quiz.isActive && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'This quiz is not active' });
    }
    
    // Get total possible score
    const questions = await Question.find({ quizId });
    const maxScore = questions.reduce((total, q) => total + q.points, 0);
    
    // Create new attempt
    const attempt = new Attempt({
      userId: req.userId,
      quizId,
      maxScore,
      startedAt: new Date()
    });
    
    const savedAttempt = await attempt.save();
    
    // Increment quiz's totalAttempts count
    await Quiz.findByIdAndUpdate(quizId, { 
      $inc: { totalAttempts: 1 } 
    });
    
    res.status(201).json({
      message: 'Quiz attempt started',
      attempt: savedAttempt
    });
  } catch (error) {
    console.error('Start attempt error:', error);
    res.status(500).json({ message: 'Server error during attempt creation' });
  }
};

// Submit answer for a question
exports.submitAnswer = async (req, res) => {
  try {
    const { attemptId, questionId, selectedAnswer } = req.body;
    
    // Find attempt
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    
    // Verify user owns this attempt
    if (attempt.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to submit to this attempt' });
    }
    
    // Check if attempt is already completed
    if (attempt.completedAt) {
      return res.status(400).json({ message: 'This attempt is already completed' });
    }
    
    // Find question
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
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
    }
    
    // Calculate points
    pointsEarned = isCorrect ? question.points : 0;
    
    // Update or add the answer
    const answer = {
      questionId,
      selectedAnswer,
      isCorrect,
      pointsEarned
    };
    
    if (existingAnswerIndex >= 0) {
      // Update existing answer
      const oldPoints = attempt.answers[existingAnswerIndex].pointsEarned || 0;
      attempt.score = attempt.score - oldPoints + pointsEarned;
      attempt.answers[existingAnswerIndex] = answer;
    } else {
      // Add new answer
      attempt.answers.push(answer);
      attempt.score += pointsEarned;
    }
    
    const updatedAttempt = await attempt.save();
    
    res.json({
      message: 'Answer submitted successfully',
      answer,
      currentScore: updatedAttempt.score
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ message: 'Server error during answer submission' });
  }
};

// Complete a quiz attempt
exports.completeAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    
    // Find attempt
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    
    // Verify user owns this attempt
    if (attempt.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to complete this attempt' });
    }
    
    // Check if attempt is already completed
    if (attempt.completedAt) {
      return res.status(400).json({ message: 'This attempt is already completed' });
    }
    
    // Mark as completed
    attempt.completedAt = new Date();
    
    // Get quiz pass score
    const quiz = await Quiz.findById(attempt.quizId);
    const isPassed = attempt.score >= quiz.passScore;
    
    const completedAttempt = await attempt.save();
    
    res.json({
      message: 'Quiz attempt completed',
      attempt: completedAttempt,
      isPassed,
      passScore: quiz.passScore
    });
  } catch (error) {
    console.error('Complete attempt error:', error);
    res.status(500).json({ message: 'Server error during attempt completion' });
  }
};

// Get attempts by user
exports.getUserAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ userId: req.userId })
      .populate('quizId', 'title category difficulty')
      .sort({ startedAt: -1 });
    
    res.json({ attempts });
  } catch (error) {
    console.error('Get user attempts error:', error);
    res.status(500).json({ message: 'Server error while fetching attempts' });
  }
};

// Get attempt details
exports.getAttemptDetails = async (req, res) => {
  try {
    const { quizId } = req.params;


    const attempt = await Attempt.findById(quizId)
      .populate('quizId', 'title category difficulty timeLimit passScore')
      .populate('answers.questionId');
    
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    
    // Check if user is authorized to view this attempt
    if (attempt.userId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this attempt' });
    }
    
    res.json({ attempt });
  } catch (error) {
    console.error('Get attempt details error:', error);
    res.status(500).json({ message: 'Server error while fetching attempt details' });
  }
};

// Get quiz statistics
exports.getQuizStats = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    // Verify quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check authorization for non-public stats
    const isAuthorized = req.userRole === 'admin' || quiz.createdBy.toString() === req.userId;
    
    // Get basic stats
    const totalAttempts = await Attempt.countDocuments({ quizId });
    const completedAttempts = await Attempt.countDocuments({ 
      quizId, 
      completedAt: { $exists: true } 
    });
    
    // Get average score from completed attempts
    const avgScoreResult = await Attempt.aggregate([
      { $match: { quizId: new mongoose.Types.ObjectId(quizId), completedAt: { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    
    const avgScore = avgScoreResult.length > 0 ? avgScoreResult[0].avgScore : 0;
    
    // Get pass rate
    const passedAttempts = await Attempt.countDocuments({
      quizId,
      completedAt: { $exists: true },
      score: { $gte: quiz.passScore }
    });
    
    const passRate = completedAttempts > 0 ? (passedAttempts / completedAttempts) * 100 : 0;
    
    // Get question performance if authorized
    let questionStats = [];
    if (isAuthorized) {
      const questions = await Question.find({ quizId });
      
      for (const question of questions) {
        const attemptsWithQuestion = await Attempt.find({
          quizId,
          'answers.questionId': question._id
        });
        
        const answersForQuestion = attemptsWithQuestion.flatMap(a => 
          a.answers.filter(ans => ans.questionId.toString() === question._id.toString())
        );
        
        const correctAnswers = answersForQuestion.filter(a => a.isCorrect).length;
        const totalAnswers = answersForQuestion.length;
        
        questionStats.push({
          questionId: question._id,
          text: question.text,
          correctRate: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
          attemptsCount: totalAnswers
        });
      }
    }
    
    res.json({
      stats: {
        totalAttempts,
        completedAttempts,
        avgScore,
        passRate,
        questionStats: isAuthorized ? questionStats : undefined
      }
    });
  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({ message: 'Server error while fetching quiz statistics' });
  }
};