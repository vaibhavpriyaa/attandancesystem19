const express = require('express');
const { body, validationResult } = require('express-validator');
const Leave = require('../models/Leave');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// @route   POST /api/leaves
// @desc    Request leave
// @access  Private
router.post('/', [
  auth,
  body('leaveType').isIn(['sick', 'casual', 'annual', 'maternity', 'paternity', 'bereavement', 'study', 'jury', 'military', 'other']).withMessage('Invalid leave type'),
  body('fromDate').isISO8601().withMessage('Invalid from date'),
  body('toDate').isISO8601().withMessage('Invalid to date'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('isHalfDay').optional().isBoolean(),
  body('halfDayType').optional().isIn(['morning', 'afternoon']),
  body('emergencyContact.name').optional().isString(),
  body('emergencyContact.phone').optional().isString(),
  body('emergencyContact.relationship').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      leaveType, 
      fromDate, 
      toDate, 
      reason, 
      priority = 'medium',
      isHalfDay = false,
      halfDayType = 'morning',
      emergencyContact
    } = req.body;

    // Validate date range
    const from = moment(fromDate);
    const to = moment(toDate);
    
    if (from.isAfter(to)) {
      return res.status(400).json({ message: 'From date cannot be after to date' });
    }

    if (from.isBefore(moment(), 'day')) {
      return res.status(400).json({ message: 'Cannot request leave for past dates' });
    }

    // In development mode, return mock response
    if (process.env.NODE_ENV === 'development') {
      const mockLeave = {
        _id: `leave-${Date.now()}`,
        userId: req.user._id,
        leaveType,
        fromDate: from.toDate(),
        toDate: to.toDate(),
        reason,
        totalDays: to.diff(from, 'days') + 1,
        priority,
        isHalfDay,
        halfDayType,
        emergencyContact,
        status: 'pending',
        createdAt: new Date()
      };

      res.status(201).json({
        message: 'Leave request submitted successfully',
        leave: mockLeave
      });
      return;
    }

    // Check for overlapping leaves
    const overlappingLeave = await Leave.findOne({
      userId: req.user._id,
      status: { $in: ['pending', 'approved'] },
      $or: [
        {
          fromDate: { $lte: to.toDate() },
          toDate: { $gte: from.toDate() }
        }
      ]
    });

    if (overlappingLeave) {
      return res.status(400).json({ message: 'Leave request overlaps with existing leave' });
    }

    // Check leave balance for annual and casual leaves
    if (['annual', 'casual'].includes(leaveType)) {
      // In development mode, skip balance check
      if (process.env.NODE_ENV === 'development') {
        // Mock balance check - always allow in development
      } else {
        const user = await User.findById(req.user._id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        const leaveBalance = user.leaveBalance || {};
        const requestedDays = to.diff(from, 'days') + 1;
        
        if (leaveBalance[leaveType] < requestedDays) {
          return res.status(400).json({ 
            message: `Insufficient ${leaveType} leave balance. Available: ${leaveBalance[leaveType] || 0} days, Requested: ${requestedDays} days` 
          });
        }
      }
    }

    const leave = new Leave({
      userId: req.user._id,
      leaveType,
      fromDate: from.toDate(),
      toDate: to.toDate(),
      reason,
      totalDays: to.diff(from, 'days') + 1,
      priority,
      isHalfDay,
      halfDayType,
      emergencyContact
    });

    await leave.save();

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leave
    });
  } catch (error) {
    console.error('Request leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaves/my-leaves
// @desc    Get current user's leave requests
// @access  Private
router.get('/my-leaves', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, leaveType, year } = req.query;
    
    // In development mode, return mock data
    if (process.env.NODE_ENV === 'development') {
      const mockLeaves = [
        {
          _id: 'leave-1',
          userId: { _id: req.user._id, name: req.user.name, email: req.user.email },
          leaveType: 'annual',
          fromDate: new Date('2025-08-15'),
          toDate: new Date('2025-08-17'),
          reason: 'Summer vacation',
          status: 'pending',
          priority: 'medium',
          totalDays: 3,
          createdAt: new Date(),
          isHalfDay: false
        },
        {
          _id: 'leave-2',
          userId: { _id: req.user._id, name: req.user.name, email: req.user.email },
          leaveType: 'sick',
          fromDate: new Date('2025-07-20'),
          toDate: new Date('2025-07-20'),
          reason: 'Not feeling well',
          status: 'approved',
          priority: 'high',
          totalDays: 1,
          createdAt: new Date('2025-07-19'),
          isHalfDay: false
        }
      ];

      // Filter mock data based on query parameters
      let filteredLeaves = mockLeaves;
      if (status) {
        filteredLeaves = filteredLeaves.filter(leave => leave.status === status);
      }
      if (leaveType) {
        filteredLeaves = filteredLeaves.filter(leave => leave.leaveType === leaveType);
      }

      const skip = (page - 1) * limit;
      const paginatedLeaves = filteredLeaves.slice(skip, skip + parseInt(limit));

      res.json({
        leaves: paginatedLeaves,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredLeaves.length / limit),
          totalRecords: filteredLeaves.length,
          hasNext: page * limit < filteredLeaves.length,
          hasPrev: page > 1
        }
      });
      return;
    }

    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (year) {
      query.fromDate = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(parseInt(year) + 1, 0, 1)
      };
    }

    const skip = (page - 1) * limit;
    
    const leaves = await Leave.find(query)
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Leave.countDocuments(query);

    res.json({
      leaves,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaves/all
// @desc    Get all leave requests (Admin only)
// @access  Private (Admin)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      userId, 
      leaveType,
      startDate,
      endDate,
      priority,
      department
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (leaveType) query.leaveType = leaveType;
    if (priority) query.priority = priority;
    if (startDate && endDate) {
      query.fromDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    let leavesQuery = Leave.find(query)
      .populate('userId', 'name email employeeId department')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by department if specified
    if (department) {
      leavesQuery = leavesQuery.where('userId.department', department);
    }

    const leaves = await leavesQuery;
    const total = await Leave.countDocuments(query);

    res.json({
      leaves,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/leaves/:id/approve
// @desc    Approve/reject leave request (Admin only)
// @access  Private (Admin)
router.put('/:id/approve', [
  adminAuth,
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('rejectionReason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, rejectionReason } = req.body;

    const leave = await Leave.findById(req.params.id).populate('userId');
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request has already been processed' });
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();

    if (status === 'rejected' && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }

          // If approved, update user's leave balance
      if (status === 'approved' && ['annual', 'casual'].includes(leave.leaveType)) {
        // In development mode, skip balance update
        if (process.env.NODE_ENV !== 'development') {
          const user = await User.findById(leave.userId._id);
          if (user && user.leaveBalance && user.leaveBalance[leave.leaveType]) {
            user.leaveBalance[leave.leaveType] -= leave.totalDays;
            await user.save();
          }
        }
      }

    await leave.save();

    res.json({
      message: `Leave request ${status} successfully`,
      leave
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/leaves/:id/cancel
// @desc    Cancel leave request (Owner only)
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this leave request' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel processed leave request' });
    }

    leave.status = 'cancelled';
    await leave.save();

    res.json({
      message: 'Leave request cancelled successfully',
      leave
    });
  } catch (error) {
    console.error('Cancel leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/leaves/:id
// @desc    Update leave request (Owner or Admin)
// @access  Private
router.put('/:id', [
  auth,
  body('leaveType').optional().isIn(['sick', 'casual', 'annual', 'maternity', 'paternity', 'bereavement', 'study', 'jury', 'military', 'other']),
  body('fromDate').optional().isISO8601(),
  body('toDate').optional().isISO8601(),
  body('reason').optional().isString(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('isHalfDay').optional().isBoolean(),
  body('halfDayType').optional().isIn(['morning', 'afternoon']),
  body('emergencyContact.name').optional().isString(),
  body('emergencyContact.phone').optional().isString(),
  body('emergencyContact.relationship').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Only owner or admin can update
    if (leave.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this leave request' });
    }

    // Cannot update if already approved/rejected
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot update processed leave request' });
    }

    const { 
      leaveType, 
      fromDate, 
      toDate, 
      reason, 
      priority,
      isHalfDay,
      halfDayType,
      emergencyContact
    } = req.body;

    if (leaveType) leave.leaveType = leaveType;
    if (reason) leave.reason = reason;
    if (priority) leave.priority = priority;
    if (isHalfDay !== undefined) leave.isHalfDay = isHalfDay;
    if (halfDayType) leave.halfDayType = halfDayType;
    if (emergencyContact) leave.emergencyContact = emergencyContact;

    if (fromDate && toDate) {
      const from = moment(fromDate);
      const to = moment(toDate);
      
      if (from.isAfter(to)) {
        return res.status(400).json({ message: 'From date cannot be after to date' });
      }

      leave.fromDate = from.toDate();
      leave.toDate = to.toDate();
      leave.totalDays = to.diff(from, 'days') + 1;
    }

    await leave.save();

    res.json({
      message: 'Leave request updated successfully',
      leave
    });
  } catch (error) {
    console.error('Update leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/leaves/:id
// @desc    Delete leave request (Owner or Admin)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Only owner or admin can delete
    if (leave.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this leave request' });
    }

    // Cannot delete if already approved/rejected
    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete processed leave request' });
    }

    await Leave.findByIdAndDelete(req.params.id);

    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    console.error('Delete leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/leaves/bulk-approve
// @desc    Bulk approve/reject leave requests (Admin only)
// @access  Private (Admin)
router.post('/bulk-approve', [
  adminAuth,
  body('leaveIds').isArray().withMessage('Leave IDs must be an array'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('rejectionReason').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { leaveIds, status, rejectionReason } = req.body;

    const leaves = await Leave.find({
      _id: { $in: leaveIds },
      status: 'pending'
    }).populate('userId');

    if (leaves.length === 0) {
      return res.status(404).json({ message: 'No pending leave requests found' });
    }

    const updatePromises = leaves.map(async (leave) => {
      leave.status = status;
      leave.approvedBy = req.user._id;
      leave.approvedAt = new Date();

      if (status === 'rejected' && rejectionReason) {
        leave.rejectionReason = rejectionReason;
      }

      // If approved, update user's leave balance
      if (status === 'approved' && ['annual', 'casual'].includes(leave.leaveType)) {
        // In development mode, skip balance update
        if (process.env.NODE_ENV !== 'development') {
          const user = await User.findById(leave.userId._id);
          if (user && user.leaveBalance && user.leaveBalance[leave.leaveType]) {
            user.leaveBalance[leave.leaveType] -= leave.totalDays;
            await user.save();
          }
        }
      }

      return leave.save();
    });

    await Promise.all(updatePromises);

    res.json({
      message: `${leaves.length} leave requests ${status} successfully`,
      processedCount: leaves.length
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaves/balance
// @desc    Get user's leave balance
// @access  Private
router.get('/balance', auth, async (req, res) => {
  try {
    // In development mode, return mock balance
    if (process.env.NODE_ENV === 'development') {
      const balance = {
        annual: {
          total: 21,
          used: 0,
          remaining: 21
        },
        sick: {
          total: 10,
          used: 0,
          remaining: 10
        },
        casual: {
          total: 7,
          used: 0,
          remaining: 7
        }
      };

      return res.json(balance);
    }

    // Default leave balance
    const balance = {
      annual: {
        total: 21,
        used: 0,
        remaining: 21
      },
      sick: {
        total: 10,
        used: 0,
        remaining: 10
      },
      casual: {
        total: 7,
        used: 0,
        remaining: 7
      }
    };

    res.json(balance);
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/leaves/balance
// @desc    Update user's leave balance (Admin only)
// @access  Private (Admin)
router.put('/balance/:userId', [
  adminAuth,
  body('annual').optional().isNumeric(),
  body('sick').optional().isNumeric(),
  body('casual').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { annual, sick, casual } = req.body;
    
    // In development mode, return mock response
    if (process.env.NODE_ENV === 'development') {
      return res.json({
        message: 'Leave balance updated successfully (development mode)',
        leaveBalance: {
          annual: annual || 20,
          sick: sick || 10,
          casual: casual || 5
        }
      });
    }
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.leaveBalance) {
      user.leaveBalance = {};
    }

    if (annual !== undefined) user.leaveBalance.annual = annual;
    if (sick !== undefined) user.leaveBalance.sick = sick;
    if (casual !== undefined) user.leaveBalance.casual = casual;

    await user.save();

    res.json({
      message: 'Leave balance updated successfully',
      leaveBalance: user.leaveBalance
    });
  } catch (error) {
    console.error('Update leave balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaves/stats
// @desc    Get leave statistics (Admin only)
// @access  Private (Admin)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    // In development mode, return mock stats
    if (process.env.NODE_ENV === 'development') {
      const mockStats = {
        summary: {
          totalRequests: 3,
          pendingRequests: 2,
          approvedRequests: 1,
          rejectedRequests: 0,
          cancelledRequests: 0,
          totalDays: 4
        },
        leaveTypeStats: [
          { _id: 'annual', count: 2, totalDays: 3 },
          { _id: 'sick', count: 1, totalDays: 1 }
        ],
        priorityStats: [
          { _id: 'medium', count: 2 },
          { _id: 'high', count: 1 }
        ]
      };

      res.json(mockStats);
      return;
    }

    const { startDate, endDate, department } = req.query;
    
    const query = {};
    
    if (startDate && endDate) {
      query.fromDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // If department is specified, get users from that department
    if (department) {
      const users = await User.find({ department }).select('_id');
      query.userId = { $in: users.map(u => u._id) };
    }

    const stats = await Leave.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejectedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          cancelledRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalDays: { $sum: '$totalDays' }
        }
      }
    ]);

    const leaveTypeStats = await Leave.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$leaveType',
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const priorityStats = await Leave.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const result = {
      summary: stats[0] || {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        cancelledRequests: 0,
        totalDays: 0
      },
      leaveTypeStats,
      priorityStats
    };

    res.json(result);
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/leaves/upcoming
// @desc    Get upcoming approved leaves
// @access  Private
router.get('/upcoming', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // In development mode, return mock upcoming leaves
    if (process.env.NODE_ENV === 'development') {
      const mockUpcomingLeaves = [
        {
          _id: 'upcoming-1',
          userId: { _id: req.user._id, name: req.user.name, email: req.user.email },
          leaveType: 'annual',
          fromDate: new Date('2025-08-15'),
          toDate: new Date('2025-08-17'),
          reason: 'Summer vacation',
          status: 'approved',
          priority: 'medium',
          totalDays: 3,
          createdAt: new Date(),
          isHalfDay: false
        }
      ];

      res.json(mockUpcomingLeaves);
      return;
    }
    
    const query = {
      status: 'approved',
      fromDate: { $gte: new Date() }
    };

    // If not admin, only show user's own leaves
    if (!req.user.role === 'admin') {
      query.userId = req.user._id;
    }

    const leaves = await Leave.find(query)
      .populate('userId', 'name email employeeId department')
      .sort({ fromDate: 1 })
      .limit(parseInt(limit));

    res.json(leaves);
  } catch (error) {
    console.error('Get upcoming leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 