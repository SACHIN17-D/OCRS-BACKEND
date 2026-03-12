const Report = require('../models/Report');
const Verification = require('../models/Verification');
const User = require('../models/User');

// PUT /api/admin/verify/:reportId  (admin only)
const verifyReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { decision, adminComment } = req.body;

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be "approved" or "rejected".' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    if (!['proof_submitted', 'under_review'].includes(report.status)) {
      return res.status(400).json({ message: 'Report is not ready for verification.' });
    }

    // Update report status
    report.status = decision === 'approved' ? 'resolved' : 'rejected';
    report.adminComment = adminComment || '';
    await report.save();

    // Save verification record
    await Verification.create({
      reportId: report._id,
      reviewedBy: req.user._id,
      decision,
      adminComment: adminComment || '',
    });

    res.json({ message: `Report ${decision} successfully.`, report });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify report.', error: err.message });
  }
};

// GET /api/admin/users  (admin only - list all users)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.', error: err.message });
  }
};

module.exports = { verifyReport, getAllUsers };
