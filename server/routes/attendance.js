const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// @route   POST /api/attendance/check-in
// @desc    Mark check-in for current user
// @access  Private
router.post('/check-in', auth, async (req, res) => {
  try {
    console.log('📝 Check-in request for user:', req.user.email);
    
    // Development mode: Use mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Development mode check-in');
      
      // Check if already checked in today (mock check)
      const today = moment().startOf('day');
      const mockAttendanceId = `mock-attendance-${req.user._id}-${today.format('YYYY-MM-DD')}`;
      
      // In a real app, you'd check the database
      // For development, we'll just return success
      const mockAttendance = {
        _id: mockAttendanceId,
        userId: req.user._id,
        date: new Date(),
        checkIn: {
          time: new Date(),
          location: req.body.location || 'Office',
          ipAddress: req.ip || req.connection.remoteAddress
        },
        status: 'present'
      };

      console.log('✅ Development check-in successful for:', req.user.email);
      
      return res.json({
        message: 'Check-in successful',
        attendance: {
          id: mockAttendance._id,
          checkIn: mockAttendance.checkIn,
          date: mockAttendance.date
        }
      });
    }

    // Production mode: Database operations
    const today = moment().startOf('day');
    
    // Check if already checked in today
    let attendance = await Attendance.findOne({
      userId: req.user._id,
      date: {
        $gte: today.toDate(),
        $lt: moment(today).endOf('day').toDate()
      }
    });

    if (attendance && attendance.checkIn.time) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    if (!attendance) {
      attendance = new Attendance({
        userId: req.user._id,
        date: new Date()
      });
    }

    attendance.checkIn = {
      time: new Date(),
      location: req.body.location || 'Office',
      ipAddress: req.ip || req.connection.remoteAddress
    };

    await attendance.save();

    res.json({
      message: 'Check-in successful',
      attendance: {
        id: attendance._id,
        checkIn: attendance.checkIn,
        date: attendance.date
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/attendance/check-out
// @desc    Mark check-out for current user
// @access  Private
router.post('/check-out', auth, async (req, res) => {
  try {
    console.log('📝 Check-out request for user:', req.user.email);
    
    // Development mode: Use mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Development mode check-out');
      
      // Mock check-out data
      const mockAttendance = {
        _id: `mock-attendance-${req.user._id}-${moment().format('YYYY-MM-DD')}`,
        userId: req.user._id,
        date: new Date(),
        checkIn: {
          time: moment().subtract(8, 'hours').toDate(),
          location: 'Office',
          ipAddress: req.ip || req.connection.remoteAddress
        },
        checkOut: {
          time: new Date(),
          location: req.body.location || 'Office',
          ipAddress: req.ip || req.connection.remoteAddress
        },
        totalHours: 8,
        status: 'present'
      };

      console.log('✅ Development check-out successful for:', req.user.email);
      
      return res.json({
        message: 'Check-out successful',
        attendance: {
          id: mockAttendance._id,
          checkIn: mockAttendance.checkIn,
          checkOut: mockAttendance.checkOut,
          totalHours: mockAttendance.totalHours,
          date: mockAttendance.date
        }
      });
    }

    // Production mode: Database operations
    const today = moment().startOf('day');
    
    const attendance = await Attendance.findOne({
      userId: req.user._id,
      date: {
        $gte: today.toDate(),
        $lt: moment(today).endOf('day').toDate()
      }
    });

    if (!attendance || !attendance.checkIn.time) {
      return res.status(400).json({ message: 'No check-in found for today' });
    }

    if (attendance.checkOut.time) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = {
      time: new Date(),
      location: req.body.location || 'Office',
      ipAddress: req.ip || req.connection.remoteAddress
    };

    await attendance.save();

    res.json({
      message: 'Check-out successful',
      attendance: {
        id: attendance._id,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        totalHours: attendance.totalHours,
        date: attendance.date
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/today-status
// @desc    Get current user's today's attendance status
// @access  Private
router.get('/today-status', auth, async (req, res) => {
  try {
    console.log('📝 Today status request for user:', req.user.email);
    
    // Development mode: Use mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Development mode today status');
      
      // Mock today's status
      const mockStatus = {
        isCheckedIn: false,
        isCheckedOut: false,
        checkInTime: null,
        checkOutTime: null,
        totalHours: 0,
        date: new Date(),
        status: 'not_checked_in'
      };

      // Randomly set some users as checked in for demo
      const hour = new Date().getHours();
      if (hour >= 9 && hour < 17) {
        mockStatus.isCheckedIn = true;
        mockStatus.checkInTime = moment().subtract(2, 'hours').toDate();
        mockStatus.status = 'checked_in';
      }

      console.log('✅ Development today status for:', req.user.email);
      
      return res.json({
        status: mockStatus
      });
    }

    // Production mode: Database operations
    const today = moment().startOf('day');
    
    const attendance = await Attendance.findOne({
      userId: req.user._id,
      date: {
        $gte: today.toDate(),
        $lt: moment(today).endOf('day').toDate()
      }
    });

    const status = {
      isCheckedIn: !!(attendance && attendance.checkIn && attendance.checkIn.time),
      isCheckedOut: !!(attendance && attendance.checkOut && attendance.checkOut.time),
      checkInTime: attendance?.checkIn?.time || null,
      checkOutTime: attendance?.checkOut?.time || null,
      totalHours: attendance?.totalHours || 0,
      date: new Date(),
      status: attendance ? (attendance.checkOut?.time ? 'checked_out' : 'checked_in') : 'not_checked_in'
    };

    res.json({ status });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/my-records
// @desc    Get current user's attendance records
// @access  Private
router.get('/my-records', auth, async (req, res) => {
  try {
    // In development mode, return mock attendance data
    if (process.env.NODE_ENV === 'development') {
      const mockAttendance = [
        {
          _id: 'attendance-1',
          userId: req.user._id,
          date: new Date(),
          checkIn: '09:00',
          checkOut: '17:00',
          status: 'present',
          totalHours: 8,
          notes: 'Regular day',
          approvedBy: null,
          createdAt: new Date()
        },
        {
          _id: 'attendance-2',
          userId: req.user._id,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          checkIn: '08:45',
          checkOut: '17:15',
          status: 'present',
          totalHours: 8.5,
          notes: 'Early arrival',
          approvedBy: null,
          createdAt: new Date()
        }
      ];

      return res.json({
        attendance: mockAttendance,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalRecords: 2,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    
    const query = { userId: req.user._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('approvedBy', 'name');

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/all
// @desc    Get all attendance records (Admin only)
// @access  Private (Admin)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      userId, 
      status, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (userId) {
      query.userId = userId;
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const attendance = await Attendance.find(query)
      .populate('userId', 'name email employeeId department')
      .populate('approvedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record (Admin only)
// @access  Private (Admin)
router.put('/:id', [
  adminAuth,
  body('status').optional().isIn(['present', 'absent', 'late', 'half-day', 'leave']),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    const { status, notes, checkIn, checkOut } = req.body;

    if (status) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;
    if (checkIn) attendance.checkIn = checkIn;
    if (checkOut) attendance.checkOut = checkOut;
    
    attendance.isManualEntry = true;
    attendance.approvedBy = req.user._id;

    await attendance.save();

    res.json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/today-status
// @desc    Get today's attendance status for current user
// @access  Private
router.get('/today-status', auth, async (req, res) => {
  try {
    const today = moment().startOf('day');
    
    const attendance = await Attendance.findOne({
      userId: req.user._id,
      date: {
        $gte: today.toDate(),
        $lt: moment(today).endOf('day').toDate()
      }
    });

    const status = {
      checkedIn: false,
      checkedOut: false,
      checkInTime: null,
      checkOutTime: null,
      totalHours: 0,
      status: 'absent'
    };

    if (attendance) {
      status.checkedIn = !!attendance.checkIn.time;
      status.checkedOut = !!attendance.checkOut.time;
      status.checkInTime = attendance.checkIn.time;
      status.checkOutTime = attendance.checkOut.time;
      status.totalHours = attendance.totalHours;
      status.status = attendance.status;
    }

    res.json(status);
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/stats
// @desc    Get attendance statistics for current user
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = { userId: req.user._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current month
      const startOfMonth = moment().startOf('month');
      const endOfMonth = moment().endOf('month');
      query.date = {
        $gte: startOfMonth.toDate(),
        $lte: endOfMonth.toDate()
      };
    }

    const stats = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
            }
          },
          absentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
            }
          },
          lateDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
            }
          },
          totalHours: { $sum: '$totalHours' }
        }
      }
    ]);

    const result = stats[0] || {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      totalHours: 0
    };

    result.attendanceRate = result.totalDays > 0 
      ? Math.round((result.presentDays / result.totalDays) * 100) 
      : 0;

    res.json(result);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 