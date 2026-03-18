const Report = require('../models/Report');
const User = require('../models/User');

// GET /api/hod/reports — HOD sees pending meeting reports for their dept
const getHodReports = async (req, res) => {
  try {
    const hod = await User.findById(req.user._id);

    // Find students in HOD's department with 3rd warning
    const students = await User.find({
      role: 'student',
      department: hod.department,
      warningLevel: 'hod_review',
    });

    const rollNos = students.map(s => s.rollNo);

    const reports = await Report.find({
      studentRollNo: { $in: rollNos },
      escalatedTo: 'hod',
    }).sort({ createdAt: -1 });

    res.json({ reports, students });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch HOD reports.', error: err.message });
  }
};

// PUT /api/hod/confirm/:reportId — HOD confirms meeting done
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

module.exports = { getHodReports, confirmMeeting };