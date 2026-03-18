const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  rollNo: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'reporter', 'student', 'hod', 'principal'],
    required: true,
  },
  department: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Warning System
  warningCount: {
    type: Number,
    default: 0,
  },
  escalatedTo: {
    type: String,
    enum: ['none', 'hod', 'principal'],
    default: 'none',
  },
  meetingStatus: {
    type: String,
    enum: ['not_required', 'pending', 'confirmed'],
    default: 'not_required',
  },
  meetingConfirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  meetingNotes: {
    type: String,
    trim: true,
  },
  warningLevel: {
    type: String,
    enum: ['clean', 'watch', 'risk', 'hod_review', 'principal_review'],
    default: 'clean',
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Auto update warning level based on count
userSchema.methods.updateWarningLevel = function () {
  if (this.warningCount === 0) this.warningLevel = 'clean';
  else if (this.warningCount === 1) this.warningLevel = 'watch';
  else if (this.warningCount === 2) this.warningLevel = 'risk';
  else if (this.warningCount === 3) this.warningLevel = 'hod_review';
  else this.warningLevel = 'principal_review';
};

module.exports = mongoose.model('User', userSchema);