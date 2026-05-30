const express = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');
const http     = require('http');
const socketIo = require('socket.io');

// Load env vars first
dotenv.config();

// Routes
const authRoutes     = require('./routes/auth.routes');
const userRoutes     = require('./routes/user.routes');
const quizRoutes     = require('./routes/quiz.routes');
const questionRoutes = require('./routes/question.routes');
const attemptRoutes  = require('./routes/attempt.routes');
const adminRoutes    = require('./routes/admin.routes');
const orgRoutes      = require('./routes/org.routes');

// Middleware
const { authenticateJWT } = require('./middleware/auth.middleware');
const { errorHandler }    = require('./middleware/error.middleware');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes — ORDER MATTERS ─────────────────────────────────────────────────────
// More-specific paths must come BEFORE the catch-all /api route (question routes).

app.use('/api/auth',     authRoutes);
app.use('/api/users',    authenticateJWT, userRoutes);
app.use('/api/admin',    authenticateJWT, adminRoutes);
app.use('/api/org',      orgRoutes);                              // org has its own auth inside
app.use('/api/quizzes',  quizRoutes);
app.use('/api/attempts', authenticateJWT, attemptRoutes);
app.use('/api/questions',authenticateJWT, questionRoutes);        // explicit prefix, not catch-all

// Health check (no auth)
app.get('/health', (_req, res) => res.json({ status: 'OK', message: 'Server is running' }));

// 404 handler for unknown API routes
app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found' }));

// ── Socket.IO ─────────────────────────────────────────────────────────────────
io.on('connection', socket => {
  socket.on('join_quiz', quizId => socket.join(quizId));
  socket.on('submit_answer', data => {
    io.to(data.quizId).emit('answer_submitted', {
      userId:     data.userId,
      questionId: data.questionId,
      isCorrect:  data.isCorrect
    });
  });
  socket.on('disconnect', () => {});
});

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-portal')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
