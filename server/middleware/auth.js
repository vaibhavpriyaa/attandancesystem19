const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Development mode: Handle development users
    if (process.env.NODE_ENV === 'development') {
      // Check if it's a development user ID
      if (decoded.userId && decoded.userId.startsWith('dev-')) {
        // Extract role from the user ID
        const parts = decoded.userId.split('-');
        const role = parts[1]; // admin or staff
        
        // Use email from token if available, otherwise generate one
        const email = decoded.email || `${parts[2]}@example.com`;
        
        // Create a mock user object
        const devUser = {
          _id: decoded.userId,
          name: role === 'admin' ? 'Admin User' : 'Staff User',
          email: email,
          role: role,
          employeeId: role === 'admin' ? 'EMP001' : 'EMP002',
          department: role === 'admin' ? 'IT' : 'HR',
          isActive: true
        };
        
        console.log('🔐 Auth middleware: Development user found:', devUser.email, 'as', devUser.role);
        req.user = devUser;
        return next();
      }
    }

    // Production mode: Database lookup
    const user = await User.findById(decoded.userId).catch(() => null);

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

const staffAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'staff' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Staff only.' });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = { auth, adminAuth, staffAuth }; 