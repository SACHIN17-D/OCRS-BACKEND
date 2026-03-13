const Report = require('../models/Report');
const User = require('../models/User');
const Verification = require('../models/Verification');
const { sendMail, templates } = require('../config/mailer');

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
      decision,
      adminComment,
    });

    // Send email to student
    const student = await User.findOne({ rollNo: report.studentRollNo });
    if (student?.email) {
      const { subject, html } = templates.reportResolved(student.name, report);
      await sendMail({ to: student.email, subject, html });
    }

    res.json({ message: `Report ${decision === 'approve' ? 'resolved' : 'rejected'} successfully.`, report });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify report.', error: err.message });
  }
};

module.exports = { verifyReport };