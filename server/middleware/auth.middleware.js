const jwt  = require('jsonwebtoken');
const config = require('../config/config');

exports.authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, config.JWT_SECRET);
  } catch {
    // 401 (not 403) so the client treats it as an expired session and sends the user to sign in
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // Read the role from the database rather than trusting the token, so demoting or
  // deactivating someone takes effect immediately instead of when their token expires
  try {
    const User = require('../models/user.model');
    const user = await User.findById(decoded.id).select('role isActive passwordChangedAt');
    if (!user) return res.status(401).json({ message: 'Account no longer exists' });
    if (user.isActive === false) return res.status(401).json({ message: 'This account has been deactivated' });
    // A password change signs out every session that was opened before it
    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime() - 1000)
      return res.status(401).json({ message: 'Your password was changed — please sign in again' });
    req.userId   = String(user._id);
    req.userRole = user.role;
    next();
  } catch (err) {
    next(err);
  }
};

/** Only the user themselves, or a platform admin, may act on /users/:id */
exports.isSelfOrAdmin = (req, res, next) => {
  if (req.userRole === 'admin' || String(req.params.id) === String(req.userId)) return next();
  return res.status(403).json({ message: 'You can only access your own account' });
};

/** Only the user themselves — admins included — e.g. changing a password */
exports.isSelf = (req, res, next) => {
  if (String(req.params.id) === String(req.userId)) return next();
  return res.status(403).json({ message: 'You can only change your own password' });
};

/**
 * optionalAuth — for public endpoints that show more to signed-in users.
 * Sets req.userId / req.userRole when a valid token is present, otherwise carries on as a guest.
 */
exports.optionalAuth = (req, _res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.userId   = decoded.id;
      req.userRole = decoded.role;
    } catch { /* invalid token on a public route: treat as guest */ }
  }
  next();
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
