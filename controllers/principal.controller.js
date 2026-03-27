const Report = require('../models/Report');
const User = require('../models/User');

const getPrincipalReports = async (req, res) => {
  try {
    // Get reports escalated to principal (high severity)
    const reports = await Report.find({
      escalatedTo: 'principal',
    }).sort({ createdAt: -1 });

    // Get student info for each report
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

    res.json({ message: 'Meeting confirmed! Admin can now approve the report.', report });
  } catch (err) {
    res.status(500).json({ message: 'Failed to confirm meeting.', error: err.message });
  }
};

module.exports = { getPrincipalReports, confirmMeeting };