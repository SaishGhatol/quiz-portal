const jwt  = require('jsonwebtoken');
const config = require('../config/config');

exports.authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded  = jwt.verify(token, config.JWT_SECRET);
    req.userId     = decoded.id;
    req.userRole   = decoded.role;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin')
    return res.status(403).json({ message: 'Access denied. Platform admin only.' });
  next();
};

/**
 * isOrgAdmin — accepts org_admin OR platform admin.
 * Also does a real-time DB check so a newly-promoted user doesn't need
 * to re-login before org_admin routes work.
 */
exports.isOrgAdmin = async (req, res, next) => {
  // Fast path: JWT already carries the correct role
  if (req.userRole === 'org_admin' || req.userRole === 'admin') return next();

  // Slow path: JWT may be stale — verify against DB
  try {
    const User = require('../models/user.model');
    const user = await User.findById(req.userId).select('role');
    if (user && (user.role === 'org_admin' || user.role === 'admin')) {
      req.userRole = user.role; // patch for downstream handlers
      return next();
    }
  } catch { /* fall through to rejection */ }

  return res.status(403).json({ message: 'Access denied. Organisation admin only.' });
};
