const Report = require('../models/Report');
const User = require('../models/User');
const Verification = require('../models/Verification');

const verifyReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { decision, adminComment } = req.body;

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    if (report.meetingStatus === 'pending') {
      return res.status(403).json({
        message: `Meeting with ${report.escalatedTo.toUpperCase()} must be confirmed first.`
      });
    }

    report.status = decision === 'approve' ? 'resolved' : 'rejected';
    report.adminComment = adminComment;
    await report.save();

    await Verification.findOneAndUpdate(
      { reportId: report._id },
      {
        reviewedBy: req.user._id,
        decision: decision === 'approve' ? 'approved' : 'rejected',
        adminComment,
      },
      { upsert: true, new: true }
    );

    res.json({
      message: `Report ${decision === 'approve' ? 'resolved' : 'rejected'} successfully.`,
      report,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify report.', error: err.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students.', error: err.message });
  }
};

const getWarnings = async (req, res) => {
  try {
    const students = await User.find({ role: 'student', warningCount: { $gt: 0 } })
      .select('-password')
      .sort({ warningCount: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch warnings.', error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ role: 1, createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.', error: err.message });
  }
};

const addUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      department: department || 'Not Assigned',
    });

    res.status(201).json({
      message: 'User created successfully.',
      user: { id: user._id, name: user.name, role: user.role, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user.', error: err.message });
  }
};

const editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, department, rollNo } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { name, email, department, rollNo },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ message: 'User updated successfully.', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user.', error: err.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      user: { id: user._id, name: user.name, isActive: user.isActive },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle user status.', error: err.message });
  }
};

const resetWarning = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.warningCount = 0;
    user.warningLevel = 'clean';
    await user.save();

    res.json({ message: 'Warning reset successfully.', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset warning.', error: err.message });
  }
};

module.exports = { verifyReport, getStudents, getWarnings, getAllUsers, addUser, editUser, toggleUserStatus, resetWarning };