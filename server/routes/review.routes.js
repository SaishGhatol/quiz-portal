const express  = require('express');
const router   = express.Router();
const Review   = require('../models/review.model');
const User     = require('../models/user.model');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');

// GET /api/reviews — public; returns approved reviews (max 6)
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({ approved: true })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('name role quote rating createdAt');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/reviews — authenticated users submit a review
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { role, quote, rating } = req.body;
    if (!quote || !role) return res.status(400).json({ message: 'role and quote are required' });

    const user = await User.findById(req.userId).select('name');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const review = await Review.create({
      userId: req.userId,
      name:   user.name,
      role,
      quote,
      rating: rating || 5,
      approved: false,
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reviews/all — admin: see all reviews (pending + approved)
router.get('/all', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/reviews/:id/approve — admin: toggle approved
router.put('/:id/approve', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    review.approved = !review.approved;
    await review.save();
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/reviews/:id — admin: remove a review
router.delete('/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
