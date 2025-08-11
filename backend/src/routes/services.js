const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticate, checkPermission } = require('../middleware/auth');
const Service = require('../models/Service');

const router = express.Router();

// @route   GET /api/v1/services
// @desc    Get all services
// @access  Private
router.get('/', authenticate, checkPermission('services', 'view'), [
  query('category').optional().isIn([
    'hair_cut', 'hair_color', 'hair_styling', 'hair_treatment',
    'nail_manicure', 'nail_pedicure', 'nail_art', 'nail_extension',
    'facial', 'skincare', 'massage', 'waxing', 'eyebrow', 'eyelash',
    'makeup', 'beard_trim', 'shaving', 'laser_treatment', 'other'
  ]).withMessage('Invalid category'),
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
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

    const { category, isActive = true, search } = req.query;

    const filter = { 
      company: req.company._id,
      isActive: isActive === 'true',
    };

    if (category) filter.category = category;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const services = await Service.find(filter)
      .populate('staff', 'firstName lastName')
      .sort({ category: 1, name: 1 });

    res.json({
      success: true,
      data: { services },
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/v1/services
// @desc    Create new service
// @access  Private
router.post('/', authenticate, checkPermission('services', 'create'), [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Service name must be between 2 and 100 characters'),
  body('category').isIn([
    'hair_cut', 'hair_color', 'hair_styling', 'hair_treatment',
    'nail_manicure', 'nail_pedicure', 'nail_art', 'nail_extension',
    'facial', 'skincare', 'massage', 'waxing', 'eyebrow', 'eyelash',
    'makeup', 'beard_trim', 'shaving', 'laser_treatment', 'other'
  ]).withMessage('Invalid category'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
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

    const serviceData = {
      ...req.body,
      company: req.company._id,
    };

    const service = new Service(serviceData);
    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: { service },
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
