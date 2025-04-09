const Question = require('../models/question.model');
const Quiz = require('../models/quiz.model');
const mongoose = require('mongoose');

// Create a new question for a quiz
exports.createQuestion = async (req, res) => {
  try {
    const { quizId, text, options, type, points, explanation } = req.body;
    
    // Validate quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check authorization (admin or quiz creator)
    if (req.userRole !== 'admin' && quiz.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to add questions to this quiz' });
    }
    
    // Create question
    const question = new Question({
      quizId,
      text,
      options,
      type,
      points: points || 1,
      explanation
    });
    
    const savedQuestion = await question.save();
    
    // Update quiz's totalQuestions count
    await Quiz.findByIdAndUpdate(quizId, { 
      $inc: { totalQuestions: 1 } 
    });
    
    res.status(201).json({
      message: 'Question created successfully',
      question: savedQuestion
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ message: 'Server error during question creation' });
  }
};

// Get all questions for a quiz
exports.getQuestionsByQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    // Validate quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    const questions = await Question.find({ quizId })
      .select(req.query.withAnswers === 'true' ? '' : '-options.isCorrect')
      .sort({ createdAt: 1 });
    
    res.json({ questions });
  } catch (error) {
    console.error('Get questions by quiz error:', error);
    res.status(500).json({ message: 'Server error while fetching questions' });
  }
};

// Update a question
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, options, type, points, explanation } = req.body;
    
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Verify authorization
    const quiz = await Quiz.findById(question.quizId);
    if (req.userRole !== 'admin' && quiz.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this question' });
    }
    
    // Update fields
    question.text = text || question.text;
    
    if (options) {
      question.options = options;
    }
    
    if (type) {
      question.type = type;
    }
    
    if (points !== undefined) {
      question.points = points;
    }
    
    if (explanation !== undefined) {
      question.explanation = explanation;
    }
    
    const updatedQuestion = await question.save();
    
    res.json({
      message: 'Question updated successfully',
      question: updatedQuestion
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ message: 'Server error during question update' });
  }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Verify authorization
    const quiz = await Quiz.findById(question.quizId);
    if (req.userRole !== 'admin' && quiz.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this question' });
    }
    
    // Delete the question
    await Question.findByIdAndDelete(id);
    
    // Update quiz's totalQuestions count
    await Quiz.findByIdAndUpdate(question.quizId, { 
      $inc: { totalQuestions: -1 } 
    });
    
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ message: 'Server error during question deletion' });
  }
};

// Bulk create questions
exports.bulkCreateQuestions = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { quizId, questions } = req.body;
    
    // Validate quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check authorization
    if (req.userRole !== 'admin' && quiz.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to add questions to this quiz' });
    }
    
    // Prepare questions with quizId
    const questionsToInsert = questions.map(q => ({
      ...q,
      quizId
    }));
    
    // Insert all questions
    const insertedQuestions = await Question.insertMany(questionsToInsert, { session });
    
    // Update quiz's totalQuestions count
    await Quiz.findByIdAndUpdate(quizId, { 
      $inc: { totalQuestions: questions.length } 
    }, { session });
    
    await session.commitTransaction();
    
    res.status(201).json({
      message: `${insertedQuestions.length} questions created successfully`,
      questions: insertedQuestions
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Bulk create questions error:', error);
    res.status(500).json({ message: 'Server error during bulk question creation' });
  } finally {
    session.endSession();
  }
};