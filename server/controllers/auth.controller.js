const mongoose = require('mongoose');
const User = require('../models/user.model');
const jwt  = require('jsonwebtoken');

// Same source as the verifying middleware, so signed tokens always validate
const { JWT_SECRET: SECRET } = require('../config/config');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: '24h' });

/** Full public user object — always include orgId + batchIds so the frontend knows membership */
const userPayload = (user) => ({
  id:             user._id,
  name:           user.name,
  email:          user.email,
  role:           user.role,
  orgId:          user.orgId   || null,
  batchIds:       user.batchIds|| [],
  profilePicture: user.profilePicture || '',
  createdAt:      user.createdAt,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['user', 'org_admin', 'admin', 'teacher'];
const MIN_PASSWORD = 6;

// ─── REGISTER ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { password } = req.body;
    const name  = String(req.body.name  || '').trim();
    const email = String(req.body.email || '').trim();
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required' });
    if (name.length > 80)
      return res.status(400).json({ message: 'Name must be 80 characters or fewer' });
    if (!EMAIL_RE.test(email))
      return res.status(400).json({ message: 'Enter a valid email address' });
    if (String(password).length < MIN_PASSWORD)
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD} characters` });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'User already exists with this email' });

    const user = new User({ name, email, password, role: 'user' });
    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      token: signToken(user),
      user: userPayload(user),
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    if (user.isActive === false)
      return res.status(403).json({ message: 'This account has been deactivated. Contact your administrator.' });

    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      token: signToken(user),
      user: userPayload(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ─── GET CURRENT USER  (/auth/me) ─────────────────────────────────────────────
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: userPayload(user) });
  } catch (err) {
    console.error('Get current user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { profilePicture } = req.body;
    // Photos are small resized images sent as data URLs; '' removes the photo
    if (profilePicture !== undefined && profilePicture !== '' &&
        !(typeof profilePicture === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(profilePicture) && profilePicture.length <= 400000))
      return res.status(400).json({ message: 'Profile photo must be a PNG, JPEG or WebP image under 300 KB' });
    const name  = req.body.name  !== undefined ? String(req.body.name).trim()  : undefined;
    const email = req.body.email !== undefined ? String(req.body.email).trim().toLowerCase() : undefined;
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'Invalid user ID' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined && (!name || name.length > 80))
      return res.status(400).json({ message: 'Name must be between 1 and 80 characters' });
    if (email !== undefined) {
      if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });
      if (email !== user.email && await User.exists({ email, _id: { $ne: user._id } }))
        return res.status(409).json({ message: 'That email is already in use' });
    }

    if (name)           user.name           = name;
    if (email)          user.email          = email;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    await user.save();

    res.json({ message: 'Profile updated successfully', user: userPayload(user) });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── CHANGE PASSWORD ──────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Current and new password are required' });
    if (String(newPassword).length < MIN_PASSWORD)
      return res.status(400).json({ message: `New password must be at least ${MIN_PASSWORD} characters` });
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 400, not 401: a typo here must not look like an expired session and sign the user out
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();
    // Other sessions are now invalid; hand this one a fresh token so it stays signed in
    res.json({ message: 'Password changed successfully', token: signToken(user) });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE OWN ACCOUNT ───────────────────────────────────────────────────────
exports.deleteMyAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Deleting an org admin would orphan the organisation's batches/students —
    // point them at support instead of silently breaking the org.
    if (user.role === 'org_admin')
      return res.status(400).json({
        message: 'Organisation admins can\'t self-delete. Contact support to transfer ownership or close your organisation first.'
      });

    const Attempt = require('../models/attempt.model');
    await Attempt.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);

    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── CHANGE ROLE (admin only) ─────────────────────────────────────────────────
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!ROLES.includes(role))
      return res.status(400).json({ message: `Role must be one of: ${ROLES.join(', ')}` });
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'Invalid user ID' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin' && role !== 'admin' && (await User.countDocuments({ role: 'admin' })) <= 1)
      return res.status(400).json({ message: 'You cannot remove the last platform admin' });
    user.role = role;
    await user.save();
    res.json({ message: 'Role updated successfully', user: userPayload(user) });
  } catch (err) {
    console.error('Change user role error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET ALL USERS ────────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET USER BY ID ───────────────────────────────────────────────────────────
exports.getUserProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: 'Invalid user ID' });

    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get user profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
