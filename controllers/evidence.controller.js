const Evidence = require('../models/Evidence');
const Report = require('../models/Report');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

const uploadEvidence = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { explanation } = req.body;

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    if (!req.file) return res.status(400).json({ message: 'Image is required.' });

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

    const evidence = await Evidence.findOneAndUpdate(
      { reportId: report._id },
      {
        submittedBy: req.user._id,
        imageUrl: result.secure_url,
        explanation,
      },
      { upsert: true, new: true }
    );

    report.status = 'under_review';
    await report.save();

    res.status(201).json({ evidence, report });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload evidence.', error: err.message });
  }
};

module.exports = { uploadEvidence, upload };