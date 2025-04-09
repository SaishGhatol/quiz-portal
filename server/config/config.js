const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  // Server configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz-portal',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'quiz-portal-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Client URL for CORS
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000'
};