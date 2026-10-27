const express = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');
const http     = require('http');

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
const billingRoutes  = require('./routes/billing.routes');
const contactRoutes  = require('./routes/contact.routes');
const reviewRoutes   = require('./routes/review.routes');
const practiceRoutes = require('./routes/practice.routes');

// Middleware
const { authenticateJWT }            = require('./middleware/auth.middleware');
const { errorHandler }               = require('./middleware/error.middleware');
const { configureSecurityMiddleware } = require('./middleware/security.middleware');

const app    = express();
const server = http.createServer(app);

// ── Core middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Security headers, rate limiting, XSS/NoSQL-injection sanitization
configureSecurityMiddleware(app);

// ── Routes — ORDER MATTERS ─────────────────────────────────────────────────────
// More-specific paths must come BEFORE the catch-all /api route (question routes).

app.use('/api/auth',     authRoutes);
app.use('/api/users',    authenticateJWT, userRoutes);
app.use('/api/admin',    authenticateJWT, adminRoutes);
app.use('/api/org',      orgRoutes);                              // org has its own auth inside
app.use('/api/billing',  billingRoutes);                          // billing has its own auth inside
app.use('/api/contact',  contactRoutes);
app.use('/api/practice', practiceRoutes);                         // practice mode + mistake notebook
app.use('/api/reviews',  reviewRoutes);                           // testimonials: public list, user submit, admin moderation
app.use('/api/quizzes',  quizRoutes);
app.use('/api/attempts', authenticateJWT, attemptRoutes);
app.use('/api/questions',authenticateJWT, questionRoutes);        // explicit prefix, not catch-all

// Health check (no auth)
app.get('/health', (_req, res) => res.json({ status: 'OK', message: 'Server is running' }));

// Demo mode only (set by dev-mem-server.js): lists the seeded accounts for the login page.
// Never enabled against a real database.
if (process.env.DEMO_MODE === '1') {
  const { DEMO_ACCOUNTS, DEMO_PASSWORD } = require('./scripts/seedDemo');
  app.get('/api/dev/demo-accounts', (_req, res) =>
    res.json({ accounts: DEMO_ACCOUNTS.map(({ key, label, description, name, email }) => ({ key, label, description, name, email, password: DEMO_PASSWORD })) }));
}

// 404 handler for unknown API routes
app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found' }));

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/examvault')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
