const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const Company = require('../models/Company');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = verifyAccessToken(token);
    
    const user = await User.findById(decoded.userId)
      .populate('company')
      .select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.',
      });
    }

    if (!user.company.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Company account is deactivated.',
      });
    }

    // Check if company has active subscription
    if (!user.company.hasActiveSubscription()) {
      return res.status(402).json({
        success: false,
        message: 'Subscription required. Please update your payment method.',
      });
    }

    req.user = user;
    req.company = user.company;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.',
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions.',
      });
    }

    next();
  };
};

const checkPermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check specific permission
    const hasPermission = req.user.permissions[resource] && 
                         req.user.permissions[resource][action];

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Cannot ${action} ${resource}.`,
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    const user = await User.findById(decoded.userId)
      .populate('company')
      .select('-password');
    
    if (user && user.isActive && user.company.isActive) {
      req.user = user;
      req.company = user.company;
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  checkPermission,
  optionalAuth,
};
