exports.errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: messages[0] || 'Invalid input',
        messages
      });
    }
    
    // Malformed ObjectId or wrongly-typed value reaching a query
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid value', message: `Invalid ${err.path || 'value'}` });
    }

    // Body that isn't valid JSON
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON', message: 'Request body is not valid JSON' });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Duplicate Key Error',
        message: 'A record with that value already exists'
      });
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Authentication failed'
      });
    }
    
    // JWT expired
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token Expired',
        message: 'Token has expired, please login again'
      });
    }
    
    // Default server error
    res.status(500).json({
      error: 'Server Error',
      message: process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
        : err.message
    });
  };