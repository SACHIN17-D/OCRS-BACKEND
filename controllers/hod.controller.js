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

module.exports = { getHodReports, confirmMeeting };