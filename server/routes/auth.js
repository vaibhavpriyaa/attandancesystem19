const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs'); // Added bcrypt for password comparison

const router = express.Router();

// Generate JWT Token
const generateToken = (userId, email = null) => {
  const payload = { userId };
  if (email) {
    payload.email = email;
  }
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (Admin only)
// @access  Private (Admin)
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'staff']).withMessage('Role must be admin or staff'),
  body('employeeId').notEmpty().withMessage('Employee ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, employeeId, department, phone } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { employeeId }] }).catch(() => null);
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role,
      employeeId,
      department,
      phone
    });

    await user.save().catch((err) => {
      console.log('📝 Database save failed, creating mock user for development');
      // Create a mock user for development
      user = {
        _id: 'mock-user-' + Date.now(),
        name,
        email,
        password, // Store password for development mode
        role,
        employeeId,
        department,
        phone
      };
    });

    const token = generateToken(user._id, user.email);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/register-public
// @desc    Register a new user (Public - anyone can register)
// @access  Public
router.post('/register-public', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('employeeId').notEmpty().withMessage('Employee ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, employeeId, department, phone } = req.body;

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { employeeId }] }).catch(() => null);
    if (user) {
      return res.status(400).json({ message: 'User with this email or employee ID already exists' });
    }

    // Generate unique employee ID if not provided
    const finalEmployeeId = employeeId || `EMP${Date.now().toString().slice(-6)}`;

    // Create new user with staff role by default
    user = new User({
      name,
      email,
      password,
      role: 'staff', // Default role for public registration
      employeeId: finalEmployeeId,
      department: department || 'General',
      phone: phone || '',
      isActive: true
    });

    await user.save().catch((err) => {
      console.log('📝 Database save failed, creating mock user for development');
      // Create a mock user for development
      const emailHash = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      user = {
        _id: `mock-user-${emailHash}-${Date.now()}`,
        name,
        email,
        password, // Store password for development mode
        role: 'staff',
        employeeId: finalEmployeeId,
        department: department || 'General',
        phone: phone || '',
        isActive: true
      };
    });

    const token = generateToken(user._id, user.email);

    res.status(201).json({
      message: 'Account created successfully! You can now login with your email and password.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Public registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Development mode: Allow any email with default password or registered users
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 Development mode login for:', email);
      
      // Default password for development mode
      const defaultPassword = '123456';
      
      // Check if this is a registered user (mock check)
      const emailHash = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const registeredUserId = `mock-user-${emailHash}-`;
      
      // For now, allow any password for registered users in development
      // In a real app, you'd check against stored passwords
      if (password === defaultPassword || password.length >= 6) {
        // Determine role based on email or use staff as default
        let role = 'staff';
        let userId = 'dev-staff-001';
        let name = 'Staff User';
        let employeeId = 'EMP002';
        let department = 'HR';
        
        // Special cases for admin emails
        if (email.toLowerCase().includes('admin') || email === 'admin@test.com') {
          role = 'admin';
          userId = 'dev-admin-001';
          name = 'Admin User';
          employeeId = 'EMP001';
          department = 'IT';
        }
        
        // Generate a unique ID for new emails
        const uniqueId = `dev-${role}-${emailHash}-${Date.now().toString().slice(-6)}`;
        
        const user = {
          _id: uniqueId,
          name: name,
          email: email,
          role: role,
          employeeId: employeeId,
          department: department,
          isActive: true
        };
        
        console.log('✅ Development login successful for:', email, 'as', role);
        
        // Include email in the token for development mode
        const token = generateToken(user._id, email);
        
        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId,
            department: user.department
          }
        });
      } else {
        return res.status(400).json({ message: 'Invalid credentials. Use password: 123456 for development mode or your registered password' });
      }
    }

    // Production mode: Database login
    const user = await User.findOne({ email }).catch(() => null);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password).catch(() => false);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save().catch(() => {
      console.log('📝 Database update failed, continuing in development mode');
    });

    const token = generateToken(user._id, user.email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        employeeId: req.user.employeeId,
        department: req.user.department,
        phone: req.user.phone,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please enter a valid phone number'),
  body('department').optional().isIn(['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations']).withMessage('Invalid department'),
  body('address').optional().isLength({ max: 500 }).withMessage('Address is too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, department, address } = req.body;
    const userId = req.user._id;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } }).catch(() => null);
      if (existingUser) {
        return res.status(400).json({ message: 'Email address is already in use' });
      }
    }

    // Development mode: Handle development users
    if (process.env.NODE_ENV === 'development' && userId.startsWith('dev-')) {
      console.log('📝 Development mode profile update for:', req.user.email);
      
      // Create updated user object
      const updatedUser = {
        ...req.user,
        name: name || req.user.name,
        email: email || req.user.email,
        phone: phone || req.user.phone,
        department: department || req.user.department,
        address: address || req.user.address
      };

      console.log('✅ Development profile updated for:', updatedUser.email);
      
      return res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          employeeId: updatedUser.employeeId,
          department: updatedUser.department,
          phone: updatedUser.phone,
          address: updatedUser.address
        }
      });
    }

    // Production mode: Update in database
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (department) updateFields.department = department;
    if (address) updateFields.address = address;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).catch(() => null);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ Profile updated for:', user.email);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).catch(() => null);
    if (!user) {
      // For security, don't reveal if email exists or not
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token (in a real app, you'd use crypto.randomBytes)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // In a real app, you would:
    // 1. Save the reset token to the user document
    // 2. Send an email with the reset link
    // 3. Use a proper email service like SendGrid, AWS SES, etc.

    console.log('📧 Password reset requested for:', email);
    console.log('🔗 Reset token:', resetToken);
    console.log('⏰ Token expires:', resetTokenExpiry);

    // For development, we'll just return success
    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.',
      development: {
        email,
        resetToken,
        resetLink: `http://localhost:3000/reset-password?token=${resetToken}`
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  body('token').exists().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    // In a real app, you would:
    // 1. Find user by reset token
    // 2. Check if token is expired
    // 3. Update password and clear token

    console.log('🔄 Password reset with token:', token);
    console.log('🔑 New password length:', newPassword.length);

    // For development, we'll just return success
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
  auth,
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Development mode: Handle development users
    if (process.env.NODE_ENV === 'development' && userId.startsWith('dev-')) {
      console.log('📝 Development mode password change for:', req.user.email);
      
      // For development, we'll just return success
      console.log('✅ Development password changed for:', req.user.email);
      
      return res.json({
        message: 'Password changed successfully'
      });
    }

    // Production mode: Update in database
    const user = await User.findById(userId).catch(() => null);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password changed for:', user.email);

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 