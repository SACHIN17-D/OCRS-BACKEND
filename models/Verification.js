const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
    unique: true,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  decision: {
    type: String,
    enum: ['approved', 'rejected'],
    required: true,
  },
  adminComment: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Verification', verificationSchema);
