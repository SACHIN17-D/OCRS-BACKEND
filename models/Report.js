const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reporterName: String,

  studentRollNo: {
    type: String,
    required: [true, 'Student Roll No is required'],
    uppercase: true,
    trim: true,
  },
  studentRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  studentName: String,

  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Attendance', 'Behavior', 'Dress Code', 'Cheating', 'Property Damage', 'Harassment', 'Other'],
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
  },
  date: {
    type: Date,
    required: [true, 'Incident date is required'],
  },
  details: {
    type: String,
    required: [true, 'Details are required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['reported', 'proof_submitted', 'under_review', 'resolved', 'rejected'],
    default: 'reported',
  },
  adminComment: String,
  appealMessage: {
    type: String,
    trim: true,
  },
  appealStatus: {
    type: String,
    enum: ['none', 'appealed', 'resubmitted'],
    default: 'none',
  },
}, { timestamps: true });

// Auto-generate reportId before saving
reportSchema.pre('save', async function (next) {
  if (!this.reportId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Report').countDocuments();
    this.reportId = `RPT-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Report', reportSchema);