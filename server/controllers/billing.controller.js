const crypto   = require('crypto');
const Razorpay = require('razorpay');

const Organization = require('../models/organization.model');
const Payment       = require('../models/payment.model');
const User          = require('../models/user.model');
const { PLANS, SELF_SERVE_PLANS } = require('../config/plans');

// Lazily constructed so the server still boots without Razorpay keys configured
// (e.g. in local dev before a merchant account is set up).
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const getOrgForUser = async (userId) => {
  const user = await User.findById(userId).select('orgId');
  return user?.orgId ? Organization.findById(user.orgId) : null;
};

// Public: plans + INR pricing shown on the pricing page and the in-app upgrade modal
exports.getPlans = (_req, res) => {
  res.json({ plans: PLANS, selfServe: SELF_SERVE_PLANS });
};

exports.createOrder = async (req, res) => {
  try {
    const razorpay = getRazorpay();
    if (!razorpay)
      return res.status(503).json({ message: 'Payments are not configured on this server yet. Contact support to upgrade.' });

    const { plan, cycle } = req.body;
    if (!SELF_SERVE_PLANS.includes(plan))
      return res.status(400).json({ message: 'This plan is not available for self-serve checkout — contact sales.' });
    if (!['monthly', 'yearly'].includes(cycle))
      return res.status(400).json({ message: 'Invalid billing cycle' });

    const org = await getOrgForUser(req.userId);
    if (!org) return res.status(404).json({ message: 'Create an organisation before upgrading a plan' });

    const amountRupees = cycle === 'yearly' ? PLANS[plan].priceYearly : PLANS[plan].priceMonthly;
    const amountPaise  = Math.round(amountRupees * 100);

    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt:  `org_${org._id}_${Date.now()}`.slice(0, 40),
      notes:    { organizationId: org._id.toString(), plan, cycle },
    });

    await Payment.create({
      organization:    org._id,
      plan, cycle,
      amount:          amountRupees,
      currency:        'INR',
      razorpayOrderId: order.id,
      status:          'created',
    });

    res.json({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId:    process.env.RAZORPAY_KEY_ID,
      orgName:  org.name,
    });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ message: 'Could not create payment order' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ message: 'Missing payment verification fields' });

    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(v => typeof v === 'string'))
      return res.status(400).json({ message: 'Invalid payment verification fields' });
    if (!process.env.RAZORPAY_KEY_SECRET)
      return res.status(503).json({ message: 'Payments are not configured on this server yet.' });

    // Only the organisation that created the order can verify it
    const callerOrg = await getOrgForUser(req.userId);
    const payment   = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment || !callerOrg || String(payment.organization) !== String(callerOrg._id))
      return res.status(404).json({ message: 'Order not found' });
    if (payment.status === 'paid') return res.json({ message: 'Already verified' });

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    payment.status            = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id;
    await payment.save();

    const org = await Organization.findById(payment.organization);
    if (!org) return res.status(404).json({ message: 'Organisation not found' });

    const cfg = PLANS[payment.plan];
    const now = new Date();
    // Extend from the current expiry if it's still in the future (renewal), else from now
    const base     = org.planExpiry && org.planExpiry > now ? org.planExpiry : now;
    const extended = new Date(base);
    if (payment.cycle === 'yearly') extended.setFullYear(extended.getFullYear() + 1);
    else extended.setMonth(extended.getMonth() + 1);

    org.plan       = payment.plan;
    org.planExpiry = extended;
    // Snapshot for display only — limits are enforced from config/plans.js by plan name
    org.limits     = { ...cfg.limits };
    await org.save();

    res.json({ message: 'Payment verified — plan upgraded', org });
  } catch (err) {
    console.error('verifyPayment error:', err);
    res.status(500).json({ message: 'Server error verifying payment' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const org = await getOrgForUser(req.userId);
    if (!org) return res.json({ payments: [] });
    const payments = await Payment.find({ organization: org._id }).sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
