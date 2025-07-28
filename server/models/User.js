const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'staff'],
    default: 'staff'
  },
  department: {
    type: String,
    trim: true
  },
  employeeId: {
    type: String,
    unique: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  // Leave balance tracking
  leaveBalance: {
    annual: {
      type: Number,
      default: 21 // Default annual leave days
    },
    sick: {
      type: Number,
      default: 10 // Default sick leave days
    },
    casual: {
      type: Number,
      default: 7 // Default casual leave days
    }
  },
  // Additional user information
  position: {
    type: String,
    trim: true
  },
  joiningDate: {
    type: Date
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without password
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Method to update leave balance
userSchema.methods.updateLeaveBalance = function(leaveType, days) {
  if (this.leaveBalance && this.leaveBalance[leaveType] !== undefined) {
    this.leaveBalance[leaveType] += days;
    return this.save();
  }
  return Promise.reject(new Error(`Invalid leave type: ${leaveType}`));
};

// Method to check leave balance
userSchema.methods.hasLeaveBalance = function(leaveType, days) {
  return this.leaveBalance && 
         this.leaveBalance[leaveType] && 
         this.leaveBalance[leaveType] >= days;
};

module.exports = mongoose.model('User', userSchema); 