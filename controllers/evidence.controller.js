const Evidence = require('../models/Evidence');
const Report = require('../models/Report');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const { sendMail, templates } = require('../config/mailer');

const uploadEvidence = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { explanation } = req.body;

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    if (!req.file) return res.status(400).json({ message: 'Image is required.' });

    // Upload to cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'ocrs_evidence' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const evidence = await Evidence.create({
      reportId: report._id,
      submittedBy: req.user._id,
      imageUrl: result.secure_url,
      explanation,
    });

    report.status = 'under_review';
    await report.save();

    // Send email to admin
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        const { subject, html } = templates.proofSubmitted(admin.name, report);
        await sendMail({ to: admin.email, subject, html });
      }
    } catch (mailErr) {
      console.error('Email failed:', mailErr.message);
    }

    res.status(201).json({ evidence, report });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload evidence.', error: err.message });
  }
};

module.exports = { uploadEvidence };