const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/billing.controller');
const { authenticateJWT, isOrgAdmin } = require('../middleware/auth.middleware');

// Plan pricing is shown on the public pricing page — no auth required
router.get('/plans', ctrl.getPlans);

router.use(authenticateJWT);
router.post('/create-order', isOrgAdmin, ctrl.createOrder);
router.post('/verify',       isOrgAdmin, ctrl.verifyPayment);
router.get ('/history',      isOrgAdmin, ctrl.getHistory);

module.exports = router;
