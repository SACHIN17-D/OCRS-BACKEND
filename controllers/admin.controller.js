const Report = require('../models/Report');
const User = require('../models/User');
const Verification = require('../models/Verification');

const verifyReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { decision, adminComment } = req.body;

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    report.status = decision === 'approve' ? 'resolved' : 'rejected';
    report.adminComment = adminComment;
    await report.save();

    await Verification.create({
      reportId: report._id,
      reviewedBy: req.user._id,
      decision: decision === 'approve' ? 'approved' : 'rejected',
      adminComment,
    });

    res.json({ message: `Report ${decision === 'approve' ? 'resolved' : 'rejected'} successfully.`, report });
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

module.exports = { verifyReport, getStudents };