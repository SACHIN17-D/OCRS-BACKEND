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

    await Verification.findOneAndUpdate(
      { reportId: report._id },
      {
        reviewedBy: req.user._id,
        decision: decision === 'approve' ? 'approved' : 'rejected',
        adminComment,
      },
      { upsert: true, new: true }
    );

    // If approved → increment student warning
    if (decision === 'approve') {
      const student = await User.findOne({ rollNo: report.studentRollNo });
      if (student) {
        student.warningCount += 1;
        if (student.warningCount === 1) student.warningLevel = 'watch';
        else if (student.warningCount === 2) student.warningLevel = 'risk';
        else if (student.warningCount === 3) student.warningLevel = 'hod_review';
        else student.warningLevel = 'principal_review';
        await student.save();
        console.log(`Warning added to ${student.name} — Level: ${student.warningLevel}`);
      }
    }

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

module.exports = { verifyReport, getStudents, getWarnings };