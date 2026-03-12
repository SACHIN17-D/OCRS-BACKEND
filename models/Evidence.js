const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
    unique: true, // one evidence per report
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  imagePublicId: String, // for cloudinary deletion if needed
  explanation: {
    type: String,
    required: [true, 'Explanation is required'],
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Evidence', evidenceSchema);
