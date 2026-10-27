const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// `xss-clean` and `express-mongo-sanitize` both sanitize by reassigning
// `req.query` wholesale (`req.query = sanitized`), which throws on Express 5 —
// `req.query` is a read-only getter there. Mutating the existing object's own
// keys in place has the same sanitizing effect without ever reassigning the
// property itself, so it works on both Express 5 and req.body/req.params.
const stripDangerousKeysInPlace = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
      continue;
    }
    if (obj[key] && typeof obj[key] === 'object') stripDangerousKeysInPlace(obj[key]);
  }
};

// Text is stored as typed: the client renders everything through React (escaped),
// so stripping "<...>" here only corrupted content like "2 < 3 and 5 > 4" or List<String>.

exports.configureSecurityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  // Strip NoSQL-injection operators ($gt, $where, dotted keys) from body/query/params
  app.use((req, res, next) => {
    [req.body, req.params, req.query].forEach(target => {
      stripDangerousKeysInPlace(target);
    });
    next();
  });

  // Rate limiting to prevent brute force and DoS attacks
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // limit each IP to 300 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    // Local in-memory demo only — clicking around every role easily exceeds this
    skip: () => process.env.DEMO_MODE === '1'
  });

  // Apply rate limiting to all routes
  app.use('/api/', limiter);

  // More strict rate limiting for auth routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many login attempts, please try again later',
    // GET /me runs on every page load to restore the session; it takes no
    // credentials, so it stays under the general limiter only. Local demo mode
    // skips this limiter entirely so switching between demo accounts never locks you out.
    skip: req => (req.method === 'GET' && req.path === '/me') || process.env.DEMO_MODE === '1'
  });

  app.use('/api/auth/', authLimiter);
};
