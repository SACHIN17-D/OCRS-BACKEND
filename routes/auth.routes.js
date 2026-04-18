const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const { login, register, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// Normal admin login
router.post('/login', login);

// Admin creates users
router.post('/register', protect, allowRoles('admin'), register);

// Get current user
router.get('/me', protect, getMe);

// Student self registration
router.post('/register-student', async (req, res) => {
  try {
    const { name, rollNo, email, department } = req.body;

    if (!name || !rollNo || !email || !department) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!email.endsWith('@bitsathy.ac.in')) {
      return res.status(400).json({ message: 'Only college emails allowed.' });
    }

    const existing = await User.findOne({
      $or: [{ email }, { rollNo: rollNo.toUpperCase() }]
    });

    if (existing) {
      return res.status(409).json({ message: 'Account already exists with this email or register number.' });
    }

    await User.create({
      name,
      rollNo: rollNo.toUpperCase(),
      email: email.toLowerCase(),
      password: Math.random().toString(36),
      role: 'student',
      department: department,
    });

    res.status(201).json({ message: 'Registration successful!' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed.', error: err.message });
  }
});

// Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account',
}));

router.get('/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) return next(err);

      // Account is deactivated
      if (!user && info?.message === 'deactivated') {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=deactivated`);
      }

      // Any other OAuth failure (email not allowed, etc.)
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=unauthorized`);
      }

      const token = generateToken(user._id);
      const userData = encodeURIComponent(JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        rollNo: user.rollNo,
        role: user.role,
        department: user.department,
      }));
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&user=${userData}`);
    })(req, res, next);
  }
);

module.exports = router;