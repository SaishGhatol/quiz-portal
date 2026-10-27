const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/contact.controller');

// Public — the global rate limiter already applied to /api/* covers abuse
router.post('/', ctrl.submitMessage);

module.exports = router;
