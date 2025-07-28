const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'annual', 'maternity', 'paternity', 'bereavement', 'study', 'jury', 'military', 'other'],
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
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
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
  // New fields for enhanced leave management
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    }
  },
  isHalfDay: {
    type: Boolean,
    default: false
  },
  halfDayType: {
    type: String,
    enum: ['morning', 'afternoon'],
    default: 'morning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // For tracking leave balance
  leaveBalance: {
    annual: { type: Number, default: 0 },
    sick: { type: Number, default: 0 },
    casual: { type: Number, default: 0 }
  },
  // For notifications
  notifications: [{
    type: {
      type: String,
      enum: ['submitted', 'approved', 'rejected', 'reminder'],
      required: true
    },
    message: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
leaveSchema.index({ userId: 1, fromDate: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ approvedBy: 1 });
leaveSchema.index({ leaveType: 1 });
leaveSchema.index({ priority: 1 });

// Virtual for calculating total days
leaveSchema.virtual('calculatedDays').get(function() {
  if (this.fromDate && this.toDate) {
    const diffTime = Math.abs(this.toDate - this.fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end date
  }
  return 0;
});

// Virtual for checking if leave is active
leaveSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'approved' && 
         this.fromDate <= now && 
         this.toDate >= now;
});

// Virtual for checking if leave is upcoming
leaveSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  return this.status === 'approved' && 
         this.fromDate > now;
});

// Pre-save middleware to calculate total days
leaveSchema.pre('save', function(next) {
  if (this.fromDate && this.toDate) {
    this.totalDays = this.calculatedDays;
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema); 