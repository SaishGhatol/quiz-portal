const express  = require('express');
const router   = express.Router();
const Review   = require('../models/review.model');
const User     = require('../models/user.model');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');
const { objectIdParam } = require('../middleware/objectId.middleware');

router.param('id', objectIdParam);

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
    const role  = typeof req.body.role  === 'string' ? req.body.role.trim()  : '';
    const quote = typeof req.body.quote === 'string' ? req.body.quote.trim() : '';
    const rating = Math.round(Number(req.body.rating) || 5);
    if (!quote || !role) return res.status(400).json({ message: 'Your role and review are required' });
    if (role.length > 80) return res.status(400).json({ message: 'Role must be 80 characters or fewer' });
    if (quote.length < 10 || quote.length > 600) return res.status(400).json({ message: 'Reviews must be between 10 and 600 characters' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5' });

    const user = await User.findById(req.userId).select('name');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // One review per person: resubmitting replaces it and sends it back for approval
    const review = await Review.findOneAndUpdate(
      { userId: req.userId },
      { userId: req.userId, name: user.name, role, quote, rating, approved: false },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ review, message: 'Thanks! Your review will appear once an admin approves it.' });
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
