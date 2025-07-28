const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, department, search } = req.query;
    
    // In development mode, return mock data
    if (process.env.NODE_ENV === 'development') {
      const mockUsers = [
        {
          _id: 'user-1',
          name: 'John Doe',
          email: 'john.doe@company.com',
          role: 'staff',
          department: 'IT',
          employeeId: 'EMP001',
          phone: '+1234567890',
          position: 'Software Developer',
          joiningDate: new Date('2023-01-15'),
          isActive: true,
          leaveBalance: {
            annual: 21,
            sick: 10,
            casual: 7
          },
          createdAt: new Date('2023-01-15')
        },
        {
          _id: 'user-2',
          name: 'Jane Smith',
          email: 'jane.smith@company.com',
          role: 'admin',
          department: 'HR',
          employeeId: 'EMP002',
          phone: '+1234567891',
          position: 'HR Manager',
          joiningDate: new Date('2022-06-01'),
          isActive: true,
          leaveBalance: {
            annual: 21,
            sick: 10,
            casual: 7
          },
          createdAt: new Date('2022-06-01')
        },
        {
          _id: 'user-3',
          name: 'Mike Johnson',
          email: 'mike.johnson@company.com',
          role: 'staff',
          department: 'Finance',
          employeeId: 'EMP003',
          phone: '+1234567892',
          position: 'Financial Analyst',
          joiningDate: new Date('2023-03-10'),
          isActive: true,
          leaveBalance: {
            annual: 21,
            sick: 10,
            casual: 7
          },
          createdAt: new Date('2023-03-10')
        },
        {
          _id: 'user-4',
          name: 'Sarah Wilson',
          email: 'sarah.wilson@company.com',
          role: 'staff',
          department: 'Marketing',
          employeeId: 'EMP004',
          phone: '+1234567893',
          position: 'Marketing Specialist',
          joiningDate: new Date('2023-02-20'),
          isActive: false,
          leaveBalance: {
            annual: 21,
            sick: 10,
            casual: 7
          },
          createdAt: new Date('2023-02-20')
        }
      ];

      // Apply filters to mock data
      let filteredUsers = mockUsers;
      if (role) {
        filteredUsers = filteredUsers.filter(user => user.role === role);
      }
      if (department) {
        filteredUsers = filteredUsers.filter(user => user.department === department);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.employeeId.toLowerCase().includes(searchLower)
        );
      }

      const skip = (page - 1) * limit;
      const paginatedUsers = filteredUsers.slice(skip, skip + parseInt(limit));

      res.json({
        users: paginatedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filteredUsers.length / limit),
          totalRecords: filteredUsers.length,
          hasNext: page * limit < filteredUsers.length,
          hasPrev: page > 1
        }
      });
      return;
    }
    
    const query = {};
    
    if (role) query.role = role;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private (Admin)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    // Development mode: Return mock user data
    if (process.env.NODE_ENV === 'development') {
      const mockUser = {
        _id: req.params.id,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'staff',
        employeeId: 'EMP001',
        department: 'Engineering',
        phone: '+1234567890',
        isActive: true,
        position: 'Software Engineer',
        joiningDate: new Date('2023-01-15'),
        manager: null,
        leaveBalance: {
          annual: 20,
          sick: 10,
          casual: 5
        },
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date()
      };
      
      return res.json({ user: mockUser });
    }

    // In development mode, skip database query
    if (process.env.NODE_ENV === 'development') {
      return res.json({ user: mockUser });
    }

    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private (Admin)
router.put('/:id', [
  adminAuth,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('role').optional().isIn(['admin', 'staff']).withMessage('Role must be admin or staff'),
  body('department').optional().isString(),
  body('phone').optional().isString(),
  body('isActive').optional().isBoolean(),
  body('position').optional().isString(),
  body('joiningDate').optional().isISO8601().withMessage('Invalid joining date'),
  body('manager').optional().isMongoId().withMessage('Invalid manager ID'),
  body('leaveBalance.annual').optional().isNumeric(),
  body('leaveBalance.sick').optional().isNumeric(),
  body('leaveBalance.casual').optional().isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { 
      name, 
      email, 
      role, 
      department, 
      phone, 
      isActive, 
      position, 
      joiningDate, 
      manager, 
      leaveBalance 
    } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;
    if (position !== undefined) user.position = position;
    if (joiningDate) user.joiningDate = new Date(joiningDate);
    if (manager) user.manager = manager;

    // Update leave balance if provided
    if (leaveBalance) {
      if (!user.leaveBalance) {
        user.leaveBalance = {};
      }
      if (leaveBalance.annual !== undefined) user.leaveBalance.annual = leaveBalance.annual;
      if (leaveBalance.sick !== undefined) user.leaveBalance.sick = leaveBalance.sick;
      if (leaveBalance.casual !== undefined) user.leaveBalance.casual = leaveBalance.casual;
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        phone: user.phone,
        isActive: user.isActive,
        position: user.position,
        joiningDate: user.joiningDate,
        manager: user.manager,
        leaveBalance: user.leaveBalance
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/departments
// @desc    Get all departments (Admin only)
// @access  Private (Admin)
router.get('/departments', adminAuth, async (req, res) => {
  try {
    const departments = await User.distinct('department');
    res.json({ departments: departments.filter(dept => dept) });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/bulk-import
// @desc    Bulk import users from CSV (Admin only)
// @access  Private (Admin)
router.post('/bulk-import', adminAuth, async (req, res) => {
  try {
    const { users } = req.body;
    
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: 'No users provided' });
    }

    const results = {
      success: [],
      errors: []
    };

    for (const userData of users) {
      try {
        const { name, email, password, role, employeeId, department, phone } = userData;

        // Validate required fields
        if (!name || !email || !password || !employeeId) {
          results.errors.push({
            email: email || 'N/A',
            error: 'Missing required fields'
          });
          continue;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
          $or: [{ email }, { employeeId }] 
        });

        if (existingUser) {
          results.errors.push({
            email,
            error: 'User already exists'
          });
          continue;
        }

        // Create new user
        const user = new User({
          name,
          email,
          password,
          role: role || 'staff',
          employeeId,
          department,
          phone
        });

        await user.save();

        results.success.push({
          email,
          employeeId,
          message: 'User created successfully'
        });
      } catch (error) {
        results.errors.push({
          email: userData.email || 'N/A',
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bulk import completed',
      results
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/leave-balance
// @desc    Get user's leave balance (Admin only)
// @access  Private (Admin)
router.get('/:id/leave-balance', adminAuth, async (req, res) => {
  try {
    // In development mode, return mock data
    if (process.env.NODE_ENV === 'development') {
      const mockBalance = {
        annual: {
          total: 21,
          used: 3,
          remaining: 18
        },
        sick: {
          total: 10,
          used: 1,
          remaining: 9
        },
        casual: {
          total: 7,
          used: 2,
          remaining: 5
        }
      };
      res.json({ balance: mockBalance });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get used leaves for this user
    const Leave = require('../models/Leave');
    const usedLeaves = await Leave.aggregate([
      { $match: { userId: user._id, status: 'approved' } },
      {
        $group: {
          _id: '$leaveType',
          used: { $sum: '$totalDays' }
        }
      }
    ]);

    const leaveBalance = user.leaveBalance || {
      annual: 21,
      sick: 10,
      casual: 7
    };

    // Calculate remaining leaves
    const usedLeavesMap = {};
    usedLeaves.forEach(leave => {
      usedLeavesMap[leave._id] = leave.used;
    });

    const balance = {
      annual: {
        total: leaveBalance.annual || 21,
        used: usedLeavesMap.annual || 0,
        remaining: (leaveBalance.annual || 21) - (usedLeavesMap.annual || 0)
      },
      sick: {
        total: leaveBalance.sick || 10,
        used: usedLeavesMap.sick || 0,
        remaining: (leaveBalance.sick || 10) - (usedLeavesMap.sick || 0)
      },
      casual: {
        total: leaveBalance.casual || 7,
        used: usedLeavesMap.casual || 0,
        remaining: (leaveBalance.casual || 7) - (usedLeavesMap.casual || 0)
      }
    };

    res.json({ balance });
  } catch (error) {
    console.error('Get user leave balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/leave-balance
// @desc    Update user's leave balance (Admin only)
// @access  Private (Admin)
router.put('/:id/leave-balance', [
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

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
    console.error('Update user leave balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/leaves
// @desc    Get user's leave history (Admin only)
// @access  Private (Admin)
router.get('/:id/leaves', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, leaveType, year } = req.query;
    
    // In development mode, return mock data
    if (process.env.NODE_ENV === 'development') {
      const mockLeaves = [
        {
          _id: 'leave-1',
          userId: req.params.id,
          leaveType: 'annual',
          fromDate: new Date('2025-08-15'),
          toDate: new Date('2025-08-17'),
          reason: 'Summer vacation',
          status: 'approved',
          priority: 'medium',
          totalDays: 3,
          createdAt: new Date('2025-07-15'),
          isHalfDay: false,
          approvedBy: { _id: 'admin-1', name: 'Jane Smith' }
        },
        {
          _id: 'leave-2',
          userId: req.params.id,
          leaveType: 'sick',
          fromDate: new Date('2025-07-20'),
          toDate: new Date('2025-07-20'),
          reason: 'Not feeling well',
          status: 'approved',
          priority: 'high',
          totalDays: 1,
          createdAt: new Date('2025-07-19'),
          isHalfDay: false,
          approvedBy: { _id: 'admin-1', name: 'Jane Smith' }
        },
        {
          _id: 'leave-3',
          userId: req.params.id,
          leaveType: 'casual',
          fromDate: new Date('2025-06-10'),
          toDate: new Date('2025-06-10'),
          reason: 'Personal appointment',
          status: 'pending',
          priority: 'low',
          totalDays: 1,
          createdAt: new Date('2025-06-08'),
          isHalfDay: true,
          halfDayType: 'morning'
        }
      ];

      // Apply filters to mock data
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

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const query = { userId: user._id };
    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (year) {
      query.fromDate = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(parseInt(year) + 1, 0, 1)
      };
    }

    const skip = (page - 1) * limit;
    
    const Leave = require('../models/Leave');
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
    console.error('Get user leaves error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics (Admin only)
// @access  Private (Admin)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    // In development mode, return mock stats
    if (process.env.NODE_ENV === 'development') {
      const mockStats = {
        totalUsers: 4,
        activeUsers: 3,
        adminUsers: 1,
        staffUsers: 3,
        departments: [
          { _id: 'IT', count: 1 },
          { _id: 'HR', count: 1 },
          { _id: 'Finance', count: 1 },
          { _id: 'Marketing', count: 1 }
        ],
        recentUsers: [
          {
            _id: 'user-3',
            name: 'Mike Johnson',
            email: 'mike.johnson@company.com',
            role: 'staff',
            department: 'Finance',
            createdAt: new Date('2023-03-10')
          },
          {
            _id: 'user-4',
            name: 'Sarah Wilson',
            email: 'sarah.wilson@company.com',
            role: 'staff',
            department: 'Marketing',
            createdAt: new Date('2023-02-20')
          },
          {
            _id: 'user-1',
            name: 'John Doe',
            email: 'john.doe@company.com',
            role: 'staff',
            department: 'IT',
            createdAt: new Date('2023-01-15')
          },
          {
            _id: 'user-2',
            name: 'Jane Smith',
            email: 'jane.smith@company.com',
            role: 'admin',
            department: 'HR',
            createdAt: new Date('2022-06-01')
          }
        ]
      };
      res.json(mockStats);
      return;
    }

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const staffUsers = await User.countDocuments({ role: 'staff' });
    
    const departments = await User.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const recentUsers = await User.find()
      .select('name email role department createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      activeUsers,
      adminUsers,
      staffUsers,
      departments,
      recentUsers
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 