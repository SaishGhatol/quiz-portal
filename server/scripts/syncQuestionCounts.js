// One-off fix: recompute every quiz's totalQuestions from the questions that actually exist.
// Needed once for data created before single-question creation kept the count in sync.
// Usage (from server/): node scripts/syncQuestionCounts.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Quiz = require('../models/quiz.model');
const Question = require('../models/question.model');

dotenv.config();

async function syncQuestionCounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/examvault');
    console.log('Connected to MongoDB');

    const counts = await Question.aggregate([{ $group: { _id: '$quizId', n: { $sum: 1 } } }]);
    const byQuiz = new Map(counts.map(c => [String(c._id), c.n]));

    const quizzes = await Quiz.find().select('title totalQuestions');
    let fixed = 0;
    for (const quiz of quizzes) {
      const actual = byQuiz.get(String(quiz._id)) || 0;
      if (quiz.totalQuestions !== actual) {
        await Quiz.updateOne({ _id: quiz._id }, { totalQuestions: actual });
        console.log(`  ${quiz.title}: ${quiz.totalQuestions} → ${actual}`);
        fixed++;
      }
    }

    console.log(`\n✅ Checked ${quizzes.length} quizzes, corrected ${fixed}.`);
    process.exit(0);
  } catch (error) {
    console.error('Error syncing question counts:', error);
    process.exit(1);
  }
}

syncQuestionCounts();
