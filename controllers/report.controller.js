const Report = require('../models/Report');
const User = require('../models/User');
const Evidence = require('../models/Evidence');
const { sendMail, templates } = require('../config/mailer');

// POST /api/reports  (reporter only)
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

    // Send email to student
    console.log('Looking for student with rollNo:', studentRollNo.toUpperCase());
    console.log('Student found:', student?.email);

    if (student?.email) {
      try {
        console.log('Sending email to:', student.email);
        const { subject, html } = templates.reportFiled(student.name, report);
        await sendMail({ to: student.email, subject, html });
        console.log('Email sent successfully!');
      } catch (mailErr) {
        console.error('Email failed:', mailErr.message);
      }
    }

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create report.', error: err.message });
  }
};

// GET /api/reports  (admin only)
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

// GET /api/reports/mine  (student only)
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

// POST /api/reports/appeal/:reportId  (student only)
const appealReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { appealMessage, action } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

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

    // Send email to admin
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      try {
        const { subject, html } = templates.appealSubmitted(admin.name, report);
        await sendMail({ to: admin.email, subject, html });
      } catch (mailErr) {
        console.error('Email failed:', mailErr.message);
      }
    }

    res.json({ message: 'Appeal submitted successfully.', report });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit appeal.', error: err.message });
  }
};

module.exports = { createReport, getAllReports, getMyReports, appealReport };