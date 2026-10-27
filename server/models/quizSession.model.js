const mongoose = require('mongoose');

// A started-but-not-submitted quiz. The server records the start time here so the
// time taken (and so leaderboard rank) can't be forged by the client on submit.
const quizSessionSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz:      { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  startedAt: { type: Date, required: true, default: Date.now },
  // Abandoned sessions clean themselves up
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

quizSessionSchema.index({ user: 1, quiz: 1 });
quizSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('QuizSession', quizSessionSchema);
