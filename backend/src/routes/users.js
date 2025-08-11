const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/v1/users
// @desc    Get all staff members
// @access  Private (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({ 
      company: req.company._id,
      _id: { $ne: req.user._id } // Exclude current user
    }).select('-password -refreshTokens');

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/v1/users
// @desc    Create new staff member
// @access  Private (Admin only)
router.post('/', authenticate, authorize('admin'), [
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'staff']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      });
    }

    const userData = {
      ...req.body,
      company: req.company._id,
    };

    const user = new User(userData);
    if (userData.role === 'admin') {
      user.setAdminPermissions();
    }
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: { user: { ...user.toObject(), password: undefined } },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
