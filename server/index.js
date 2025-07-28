const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-system';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('💡 To fix this:');
    console.log('   1. Install MongoDB locally: brew install mongodb-community');
    console.log('   2. Or use MongoDB Atlas (cloud): Update MONGODB_URI in .env');
    console.log('   3. Or use a local MongoDB instance');
    
    // For development, we can continue without database
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Running in development mode without database');
      console.log('📝 You can install MongoDB later using: npm run setup-mongodb');
    } else {
      process.exit(1);
    }
  }
};

// Initialize with sample data if no database
const initializeSampleData = () => {
  console.log('📝 Initializing with sample data for development...');
  // This will be used when MongoDB is not available
};

// Override mongoose operations when database is not available
const overrideMongooseOperations = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Overriding mongoose operations for development mode...');
    
    // Override User model operations
    const User = require('./models/User');
    
    // Create a mock query object with select method
    const createMockQuery = (data) => ({
      select: () => createMockQuery(data),
      exec: () => Promise.resolve(data),
      populate: () => createMockQuery(data),
      lean: () => data,
      then: (resolve) => Promise.resolve(data).then(resolve),
      catch: (reject) => Promise.resolve(data).catch(reject)
    });
    
    User.findOne = async () => null;
    User.findById = (id) => createMockQuery({
      _id: id,
      name: 'Mock User',
      email: 'mock@example.com',
      role: 'staff',
      leaveBalance: {
        annual: { total: 21, used: 0, remaining: 21 },
        sick: { total: 10, used: 0, remaining: 10 },
        casual: { total: 7, used: 0, remaining: 7 }
      }
    });
    User.create = async (userData) => {
      console.log('📝 Mock user creation:', userData.email);
      return { ...userData, _id: 'mock-user-id', id: 'mock-user-id' };
    };
    
    // Override Leave model operations
    const Leave = require('./models/Leave');
    Leave.find = async () => [];
    Leave.findById = (id) => createMockQuery({
      _id: id,
      userId: 'mock-user-id',
      leaveType: 'annual',
      startDate: new Date(),
      endDate: new Date(),
      totalDays: 1,
      reason: 'Mock leave request',
      status: 'pending'
    });
    Leave.create = async (leaveData) => {
      console.log('📝 Mock leave creation:', leaveData.leaveType);
      return { ...leaveData, _id: 'mock-leave-id', id: 'mock-leave-id' };
    };
    
    // Override Attendance model operations
    const Attendance = require('./models/Attendance');
    Attendance.find = async () => [];
    Attendance.findById = (id) => createMockQuery({
      _id: id,
      userId: 'mock-user-id',
      date: new Date(),
      checkIn: new Date(),
      checkOut: new Date(),
      status: 'present'
    });
    Attendance.create = async (attendanceData) => {
      console.log('📝 Mock attendance creation:', attendanceData.date);
      return { ...attendanceData, _id: 'mock-attendance-id', id: 'mock-attendance-id' };
    };
    
    console.log('✅ Mongoose operations overridden for development');
  }
};

connectDB().then(() => {
  if (process.env.NODE_ENV === 'development') {
    initializeSampleData();
    overrideMongooseOperations();
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/leaves', require('./routes/leaves'));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 