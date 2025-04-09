exports.errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        error: 'Validation Error',
        messages
      });
    }
    
    // Mongoose duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
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