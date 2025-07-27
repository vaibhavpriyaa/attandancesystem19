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
  body('isActive').optional().isBoolean()
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

    const { name, email, role, department, phone, isActive } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = isActive;

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
        isActive: user.isActive
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

module.exports = router; 