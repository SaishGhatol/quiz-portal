const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

exports.configureSecurityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());
  
  // Sanitize data to prevent XSS attacks
  app.use(xss());
  
  // Sanitize data to prevent NoSQL injection
  app.use(mongoSanitize());
  
  // Rate limiting to prevent brute force and DoS attacks
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
  });
  
  // Apply rate limiting to all routes
  app.use('/api/', limiter);
  
  // More strict rate limiting for auth routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts, please try again later'
  });
  
  app.use('/api/auth/', authLimiter);
};