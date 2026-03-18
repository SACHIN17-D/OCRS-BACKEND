const Report = require('../models/Report');
const User = require('../models/User');

// GET /api/principal/reports — Principal sees 4th warning students
const getPrincipalReports = async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      warningLevel: 'principal_review',
    });

    const rollNos = students.map(s => s.rollNo);

    const reports = await Report.find({
      studentRollNo: { $in: rollNos },
      escalatedTo: 'principal',
    }).sort({ createdAt: -1 });

    res.json({ reports, students });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch principal reports.', error: err.message });
  }
};

// PUT /api/principal/confirm/:reportId — Principal confirms meeting done
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