const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'annual', 'maternity', 'paternity', 'other'],
    required: true
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  totalDays: {
    type: Number,
    required: true
  },
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
leaveSchema.index({ userId: 1, fromDate: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ approvedBy: 1 });

// Virtual for calculating total days
leaveSchema.virtual('calculatedDays').get(function() {
  if (this.fromDate && this.toDate) {
    const diffTime = Math.abs(this.toDate - this.fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end date
  }
  return 0;
});

// Pre-save middleware to calculate total days
leaveSchema.pre('save', function(next) {
  if (this.fromDate && this.toDate) {
    this.totalDays = this.calculatedDays;
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema); 