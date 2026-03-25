const Report = require('../models/Report');
const User = require('../models/User');
const Evidence = require('../models/Evidence');

const createReport = async (req, res) => {
  try {
    const { studentRollNo, category, severity, date, details, reporterEvidenceNote } = req.body;

    if (!studentRollNo || !category || !date || !details) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const student = await User.findOne({ rollNo: studentRollNo.toUpperCase(), role: 'student' });

    // Upload image if provided
    let reporterEvidence = null;
    if (req.file) {
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'ocrs_reporter_evidence' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      reporterEvidence = result.secure_url;
    }

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
      reporterEvidence,
      reporterEvidenceNote,
    });

    // Increment warning when report is filed
    if (student) {
      student.warningCount += 1;
      if (student.warningCount === 1) student.warningLevel = 'watch';
      else if (student.warningCount === 2) student.warningLevel = 'risk';
      else if (student.warningCount === 3) student.warningLevel = 'hod_review';
      else student.warningLevel = 'principal_review';
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