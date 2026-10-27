// Single source of truth for plan limits and INR pricing.
// -1 on any limit means "unlimited".
const PLANS = {
  free: {
    label: 'Free',
    limits: { maxStudents: 25, maxBatches: 3, maxQuizzes: 10 },
    priceMonthly: 0,
    priceYearly: 0,
  },
  basic: {
    label: 'Basic',
    limits: { maxStudents: 150, maxBatches: 10, maxQuizzes: -1 },
    priceMonthly: 1999,
    priceYearly: 19990, // ~2 months free
  },
  pro: {
    label: 'Pro',
    limits: { maxStudents: 500, maxBatches: -1, maxQuizzes: -1 },
    priceMonthly: 4999,
    priceYearly: 49990, // ~2 months free
  },
  enterprise: {
    label: 'Enterprise',
    limits: { maxStudents: -1, maxBatches: -1, maxQuizzes: -1 },
    priceMonthly: null, // custom — sales-assisted, not self-serve
    priceYearly: null,
  },
};

// Plans a customer can buy themselves through Razorpay checkout
const SELF_SERVE_PLANS = ['basic', 'pro'];

const withinLimit = (count, limit) => limit === -1 || count < limit;

module.exports = { PLANS, SELF_SERVE_PLANS, withinLimit };
