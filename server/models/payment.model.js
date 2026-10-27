const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  plan:         { type: String, enum: ['basic', 'pro'], required: true },
  cycle:        { type: String, enum: ['monthly', 'yearly'], required: true },
  amount:       { type: Number, required: true }, // in INR rupees
  currency:     { type: String, default: 'INR' },

  razorpayOrderId:   { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String, default: null },

  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
