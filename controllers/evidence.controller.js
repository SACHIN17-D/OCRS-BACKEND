const Evidence = require('../models/Evidence');
const Report = require('../models/Report');

// POST /api/evidence/:reportId  (student only)
const uploadEvidence = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { explanation } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required.' });
    }
    if (!explanation) {
      return res.status(400).json({ message: 'Explanation is required.' });
    }

    // Find the report
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    // Make sure only the concerned student can upload
    if (report.studentRollNo !== req.user.rollNo) {
      return res.status(403).json({ message: 'You can only upload proof for your own reports.' });
    }

    // Only allow if status is 'reported'
    if (report.status !== 'reported') {
      return res.status(400).json({ message: 'Proof has already been submitted for this report.' });
    }

    // Save evidence
    const evidence = await Evidence.create({
      reportId: report._id,
      submittedBy: req.user._id,
      imageUrl: req.file.path,         // Cloudinary URL
      imagePublicId: req.file.filename, // Cloudinary public_id
      explanation,
    });

    // Update report status
    report.status = 'proof_submitted';
    await report.save();

    res.status(201).json({ message: 'Proof submitted successfully.', evidence });
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload evidence.', error: err.message });
  }
};

module.exports = { uploadEvidence };
