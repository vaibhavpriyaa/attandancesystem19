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
  body('leaveType').isIn(['sick', 'casual', 'annual', 'maternity', 'paternity', 'other']).withMessage('Invalid leave type'),
  body('fromDate').isISO8601().withMessage('Invalid from date'),
  body('toDate').isISO8601().withMessage('Invalid to date'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { leaveType, fromDate, toDate, reason } = req.body;

    // Validate date range
    const from = moment(fromDate);
    const to = moment(toDate);
    
    if (from.isAfter(to)) {
      return res.status(400).json({ message: 'From date cannot be after to date' });
    }

    if (from.isBefore(moment(), 'day')) {
      return res.status(400).json({ message: 'Cannot request leave for past dates' });
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

    const leave = new Leave({
      userId: req.user._id,
      leaveType,
      fromDate: from.toDate(),
      toDate: to.toDate(),
      reason,
      totalDays: to.diff(from, 'days') + 1
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
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { userId: req.user._id };
    if (status) query.status = status;

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
      endDate
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (leaveType) query.leaveType = leaveType;
    if (startDate && endDate) {
      query.fromDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;
    
    const leaves = await Leave.find(query)
      .populate('userId', 'name email employeeId department')
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

    const leave = await Leave.findById(req.params.id);
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

// @route   PUT /api/leaves/:id
// @desc    Update leave request (Owner or Admin)
// @access  Private
router.put('/:id', [
  auth,
  body('leaveType').optional().isIn(['sick', 'casual', 'annual', 'maternity', 'paternity', 'other']),
  body('fromDate').optional().isISO8601(),
  body('toDate').optional().isISO8601(),
  body('reason').optional().isString()
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

    const { leaveType, fromDate, toDate, reason } = req.body;

    if (leaveType) leave.leaveType = leaveType;
    if (reason) leave.reason = reason;

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

// @route   GET /api/leaves/stats
// @desc    Get leave statistics (Admin only)
// @access  Private (Admin)
router.get('/stats', adminAuth, async (req, res) => {
  try {
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

    const result = {
      summary: stats[0] || {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        totalDays: 0
      },
      leaveTypeStats
    };

    res.json(result);
  } catch (error) {
    console.error('Get leave stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 