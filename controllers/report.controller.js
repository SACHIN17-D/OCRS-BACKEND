const Report = require('../models/Report');
const User = require('../models/User');
const Evidence = require('../models/Evidence');
const { sendReportFiledEmail } = require('../utils/mailer');

const createReport = async (req, res) => {
  try {
    const { studentRollNo, category, severity, date, details } = req.body;

    if (!studentRollNo || !category || !date || !details) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const student = await User.findOne({ rollNo: studentRollNo.toUpperCase(), role: 'student' });

    const report = await Report.create({
      reportedBy: req.user._id,
      reporterName: req.user.name,
      studentRollNo: studentRollNo.toUpperCase(),
      studentRef: student?._id || null,
      studentName: student?.name || 'Unknown',
      category,
      severity: severity || 'low',
      date,
      details,
      status: 'reported',
    });

    // Increment warning when report is filed
    if (student) {
      student.warningCount += 1;

      // Severity overrides count-based level if it escalates higher
      if (severity === 'high') {
        student.warningLevel = 'principal_review';
      } else if (severity === 'medium') {
        // Upgrade to hod_review, but don't downgrade if already at principal_review
        if (student.warningLevel !== 'principal_review') {
          student.warningLevel = 'hod_review';
        }
      } else {
        // Low severity: assign level by count only if not already at a higher level
        const countLevel =
          student.warningCount === 1 ? 'watch' :
          student.warningCount === 2 ? 'risk' :
          student.warningCount === 3 ? 'hod_review' : 'principal_review';

        const levelOrder = ['clean', 'watch', 'risk', 'hod_review', 'principal_review'];
        const currentIdx = levelOrder.indexOf(student.warningLevel);
        const newIdx = levelOrder.indexOf(countLevel);
        if (newIdx > currentIdx) student.warningLevel = countLevel;
      }

      await student.save();
    }

    // Auto escalate based on severity
    if (severity === 'medium') {
      report.escalatedTo = 'hod';
      report.meetingStatus = 'pending';
      await report.save();
    } else if (severity === 'high') {
      report.escalatedTo = 'principal';
      report.meetingStatus = 'pending';
      await report.save();
    }

    // Send email notification to student (fire-and-forget — won't break the request)
    if (student?.email) {
      sendReportFiledEmail({
        studentEmail: student.email,
        studentName: student.name,
        reportId: report.reportId,
        category: report.category,
        severity: report.severity,
        date: report.date,
        details: report.details,
        reporterName: req.user.name,
      });
    }

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create report.', error: err.message });
  }
};

const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    const reportsWithEvidence = await Promise.all(
      reports.map(async (r) => {
        const evidence = await Evidence.findOne({ reportId: r._id });
        return { ...r.toObject(), evidence };
      })
    );
    res.json(reportsWithEvidence);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reports.', error: err.message });
  }
};

const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ studentRollNo: req.user.rollNo }).sort({ createdAt: -1 });
    const reportsWithEvidence = await Promise.all(
      reports.map(async (r) => {
        const evidence = await Evidence.findOne({ reportId: r._id });
        return { ...r.toObject(), evidence };
      })
    );
    res.json(reportsWithEvidence);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch your reports.', error: err.message });
  }
};

const appealReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { appealMessage, action } = req.body;

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    if (report.studentRollNo !== req.user.rollNo) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    if (report.status !== 'rejected') {
      return res.status(400).json({ message: 'Only rejected reports can be appealed.' });
    }

    report.status = 'under_review';
    report.appealMessage = appealMessage;
    report.appealStatus = action === 'resubmit' ? 'resubmitted' : 'appealed';
    await report.save();

    res.json({ message: 'Appeal submitted successfully.', report });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit appeal.', error: err.message });
  }
};

const getReporterReports = async (req, res) => {
  try {
    const reports = await Report.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reports.', error: err.message });
  }
};

const lookupStudent = async (req, res) => {
  try {
    const { rollNo } = req.params;
    const student = await User.findOne({ rollNo: rollNo.toUpperCase(), role: 'student' }).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: 'Failed to lookup student.', error: err.message });
  }
};

module.exports = { createReport, getAllReports, getMyReports, appealReport, getReporterReports, lookupStudent };