const Report = require('../models/Report');
const User = require('../models/User');
const Verification = require('../models/Verification');

const getHodReports = async (req, res) => {
  try {
    const hod = await User.findById(req.user._id);

    const students = await User.find({
      role: 'student',
      department: hod.department,
    }).select('rollNo');

    const rollNos = students.map(s => s.rollNo);

    const reports = await Report.find({
      escalatedTo: 'hod',
      studentRollNo: { $in: rollNos },
    }).sort({ createdAt: -1 });

    const studentDetails = await User.find({ rollNo: { $in: rollNos } }).select('-password');

    res.json({ reports, students: studentDetails });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch HOD reports.', error: err.message });
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

    res.json({ message: 'Meeting confirmed! HOD can now approve the report.', report });
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

    // HOD can only handle reports escalated to hod
    if (report.escalatedTo !== 'hod') {
      return res.status(403).json({ message: 'This report is not assigned to HOD for approval.' });
    }

    if (report.meetingStatus === 'pending') {
      return res.status(403).json({ message: 'Meeting must be confirmed before approving.' });
    }

    // Tiered check: HOD handles 3rd warning only
    if (decision === 'approve' && report.studentRef) {
      const student = await User.findById(report.studentRef);
      if (student && student.warningCount !== 3) {
        if (student.warningCount >= 4) {
          return res.status(403).json({ message: `This student has ${student.warningCount} warnings. Must be approved by the Principal.` });
        }
        if (student.warningCount < 3) {
          return res.status(403).json({ message: `This report should be approved by the Admin.` });
        }
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

module.exports = { getHodReports, confirmMeeting, verifyReport };