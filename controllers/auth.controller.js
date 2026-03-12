const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, rollNo, password, role } = req.body;

    if (!password || !role) {
      return res.status(400).json({ message: 'Password and role are required.' });
    }

    // Find user by email or rollNo
    let user;
    if (role === 'student') {
      if (!rollNo) return res.status(400).json({ message: 'Roll number is required.' });
      user = await User.findOne({ rollNo: rollNo.toUpperCase(), role: 'student' }).select('+password');
    } else {
      if (!email) return res.status(400).json({ message: 'Email is required.' });
      user = await User.findOne({ email: email.toLowerCase(), role }).select('+password');
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Wrong password.' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNo: user.rollNo,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login.', error: err.message });
  }
};

// POST /api/auth/register  (admin only creates users)
const register = async (req, res) => {
  try {
    const { name, email, rollNo, password, role, department } = req.body;

    if (!name || !password || !role) {
      return res.status(400).json({ message: 'Name, password and role are required.' });
    }

    const existing = await User.findOne({
      $or: [
        email ? { email: email.toLowerCase() } : null,
        rollNo ? { rollNo: rollNo.toUpperCase() } : null,
      ].filter(Boolean),
    });

    if (existing) {
      return res.status(409).json({ message: 'User with this email or roll number already exists.' });
    }

    const user = await User.create({ name, email, rollNo, password, role, department });

    res.status(201).json({
      message: 'User created successfully.',
      user: { id: user._id, name: user.name, role: user.role, rollNo: user.rollNo },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration.', error: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user });
};

module.exports = { login, register, getMe };
