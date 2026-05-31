const User = require('../models/user.model');
const jwt  = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'examvault-secret-123';

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

// ─── REGISTER ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required' });

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

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

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
    const { name, email, profilePicture } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name)           user.name           = name;
    if (email)          user.email          = email;
    if (profilePicture) user.profilePicture = profilePicture;
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
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── CHANGE ROLE (admin only) ─────────────────────────────────────────────────
exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
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
    const mongoose = require('mongoose');
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
