const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const Company = require('../models/Company');

const router = express.Router();

// @route   GET /api/v1/companies/profile
// @desc    Get company profile
// @access  Private
router.get('/profile', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: { company: req.company },
    });
  } catch (error) {
    console.error('Get company profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   PUT /api/v1/companies/profile
// @desc    Update company profile
// @access  Private (Admin only)
router.put('/profile', authenticate, authorize('admin'), [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/),
  body('businessType').optional().isIn(['salon', 'barbershop', 'spa', 'clinic']),
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

    const updateData = req.body;
    Object.assign(req.company, updateData);
    await req.company.save();

    res.json({
      success: true,
      message: 'Company profile updated successfully',
      data: { company: req.company },
    });
  } catch (error) {
    console.error('Update company profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
