const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
    unique: true,
  },
  // Reporter's proof
  reporterImageUrl: { type: String },
  reporterExplanation: { type: String },
  reporterSubmittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Student's proof
  studentImageUrl: { type: String },
  studentExplanation: { type: String },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Keep old fields for backward compatibility
  imageUrl: { type: String },
  explanation: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Evidence', evidenceSchema);