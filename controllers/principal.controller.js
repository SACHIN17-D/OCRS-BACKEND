const Report = require('../models/Report');
const User = require('../models/User');
const Verification = require('../models/Verification');

const getPrincipalReports = async (req, res) => {
  try {
    const reports = await Report.find({ escalatedTo: 'principal' }).sort({ createdAt: -1 });
    const rollNos = [...new Set(reports.map(r => r.studentRollNo))];
    const students = await User.find({ rollNo: { $in: rollNos } }).select('-password');
    res.json({ reports, students });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch principal reports.', error: err.message });
  }
};

const confirmMeeting = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { meetingNotes } = req.body;

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    report.meetingStatus = 'confirmed';
    report.meetingConfirmedBy = req.user._id;
    report.meetingNotes = meetingNotes || '';
    await report.save();

    res.json({ message: 'Meeting confirmed! Principal can now approve the report.', report });
  } catch (err) {
    res.status(500).json({ message: 'Failed to confirm meeting.', error: err.message });
  }
};

const verifyReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { decision, adminComment } = req.body;

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    if (report.escalatedTo !== 'principal') {
      return res.status(403).json({ message: 'This report is not assigned to the Principal for approval.' });
    }

    if (report.meetingStatus === 'pending') {
      return res.status(403).json({ message: 'Meeting must be confirmed before approving.' });
    }

    // Tiered check: Principal handles 4th+ warning only
    if (decision === 'approve' && report.studentRef) {
      const student = await User.findById(report.studentRef);
      if (student && student.warningCount < 4) {
        return res.status(403).json({ message: `This student has ${student.warningCount} warnings. This report should be handled by Admin or HOD.` });
      }
    }

    report.status = decision === 'approve' ? 'resolved' : 'rejected';
    report.adminComment = adminComment;

    if (report.studentRef) {
      const student = await User.findById(report.studentRef);
      if (student) {
        if (decision === 'approve') {
          report.warningIssued = true;
        } else {
          if (!report.warningIssued && student.warningCount > 0) {
            student.warningCount = Math.max(0, student.warningCount - 1);
          }
        }

        const levelOrder = ['clean', 'watch', 'risk', 'hod_review', 'principal_review'];
        const count = student.warningCount;
        let newLevel;
        if (count === 0) newLevel = 'clean';
        else if (count === 1) newLevel = 'watch';
        else if (count === 2) newLevel = 'risk';
        else if (count === 3) newLevel = 'hod_review';
        else newLevel = 'principal_review';

        const currentIdx = levelOrder.indexOf(student.warningLevel);
        const newIdx = levelOrder.indexOf(newLevel);
        if (decision === 'reject' || newIdx > currentIdx) {
          student.warningLevel = newLevel;
        }

        await student.save();
      }
    }

    await report.save();

    await Verification.findOneAndUpdate(
      { reportId: report._id },
      { reviewedBy: req.user._id, decision: decision === 'approve' ? 'approved' : 'rejected', adminComment },
      { upsert: true, new: true }
    );

    res.json({ message: `Report ${decision === 'approve' ? 'resolved' : 'rejected'} successfully.`, report });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify report.', error: err.message });
  }
};

module.exports = { getPrincipalReports, confirmMeeting, verifyReport };