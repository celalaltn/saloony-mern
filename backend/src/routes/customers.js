const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticate, checkPermission } = require('../middleware/auth');
const Customer = require('../models/Customer');
const Appointment = require('../models/Appointment');
const PackageInstance = require('../models/PackageInstance');

const router = express.Router();

// @route   GET /api/v1/customers
// @desc    Get customers with filters and search
// @access  Private
router.get('/', authenticate, checkPermission('customers', 'view'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isLength({ min: 1 }).withMessage('Search term cannot be empty'),
  query('tags').optional().isArray().withMessage('Tags must be an array'),
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

    const {
      page = 1,
      limit = 20,
      search,
      tags,
      isActive = true,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build filter
    const filter = { 
      company: req.company._id,
      isActive: isActive === 'true',
    };

    // Add search functionality
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get customers
    const customers = await Customer.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('preferences.preferredStaff', 'firstName lastName');

    const total = await Customer.countDocuments(filter);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/v1/customers/:id
// @desc    Get single customer with history
// @access  Private
router.get('/:id', authenticate, checkPermission('customers', 'view'), async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      company: req.company._id,
    }).populate('preferences.preferredStaff', 'firstName lastName');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Get customer's appointment history
    const appointments = await Appointment.find({
      customer: customer._id,
      company: req.company._id,
    })
      .populate('staff', 'firstName lastName')
      .populate('services.service', 'name category')
      .sort({ dateTime: -1 })
      .limit(10);

    // Get customer's active packages
    const activePackages = await PackageInstance.find({
      customer: customer._id,
      company: req.company._id,
      status: 'active',
    }).populate('package', 'name totalSessions');

    res.json({
      success: true,
      data: {
        customer,
        recentAppointments: appointments,
        activePackages,
      },
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/v1/customers
// @desc    Create new customer
// @access  Private
router.post('/', authenticate, checkPermission('customers', 'create'), [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('phone').matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please enter a valid phone number'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('dateOfBirth').optional().isISO8601().withMessage('Please enter a valid date of birth'),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
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

    const {
      firstName,
      lastName,
      phone,
      email,
      dateOfBirth,
      gender,
      address,
      notes,
      preferences,
      tags,
    } = req.body;

    // Check if customer with same phone exists in this company
    const existingCustomer = await Customer.findOne({
      company: req.company._id,
      phone,
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this phone number already exists',
      });
    }

    // Check if email is provided and already exists
    if (email) {
      const existingEmailCustomer = await Customer.findOne({
        company: req.company._id,
        email,
      });

      if (existingEmailCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email already exists',
        });
      }
    }

    const customer = new Customer({
      company: req.company._id,
      firstName,
      lastName,
      phone,
      email,
      dateOfBirth,
      gender,
      address,
      notes,
      preferences,
      tags,
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { customer },
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   PUT /api/v1/customers/:id
// @desc    Update customer
// @access  Private
router.put('/:id', authenticate, checkPermission('customers', 'edit'), [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Please enter a valid phone number'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('dateOfBirth').optional().isISO8601().withMessage('Please enter a valid date of birth'),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']).withMessage('Invalid gender'),
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

    const customer = await Customer.findOne({
      _id: req.params.id,
      company: req.company._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const updateData = req.body;

    // Check for phone number conflicts
    if (updateData.phone && updateData.phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({
        company: req.company._id,
        phone: updateData.phone,
        _id: { $ne: customer._id },
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this phone number already exists',
        });
      }
    }

    // Check for email conflicts
    if (updateData.email && updateData.email !== customer.email) {
      const existingEmailCustomer = await Customer.findOne({
        company: req.company._id,
        email: updateData.email,
        _id: { $ne: customer._id },
      });

      if (existingEmailCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email already exists',
        });
      }
    }

    // Update customer
    Object.assign(customer, updateData);
    await customer.save();

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer },
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   DELETE /api/v1/customers/:id
// @desc    Deactivate customer
// @access  Private
router.delete('/:id', authenticate, checkPermission('customers', 'delete'), async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      company: req.company._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Check if customer has upcoming appointments
    const upcomingAppointments = await Appointment.countDocuments({
      customer: customer._id,
      company: req.company._id,
      dateTime: { $gt: new Date() },
      status: { $in: ['scheduled', 'confirmed'] },
    });

    if (upcomingAppointments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate customer with upcoming appointments',
      });
    }

    customer.isActive = false;
    await customer.save();

    res.json({
      success: true,
      message: 'Customer deactivated successfully',
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/v1/customers/:id/appointments
// @desc    Get customer's appointment history
// @access  Private
router.get('/:id/appointments', authenticate, checkPermission('customers', 'view'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
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

    const { page = 1, limit = 20 } = req.query;

    // Verify customer exists and belongs to company
    const customer = await Customer.findOne({
      _id: req.params.id,
      company: req.company._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find({
      customer: customer._id,
      company: req.company._id,
    })
      .populate('staff', 'firstName lastName')
      .populate('services.service', 'name category price')
      .sort({ dateTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments({
      customer: customer._id,
      company: req.company._id,
    });

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get customer appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/v1/customers/:id/packages
// @desc    Get customer's package instances
// @access  Private
router.get('/:id/packages', authenticate, checkPermission('customers', 'view'), async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      company: req.company._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const packages = await PackageInstance.find({
      customer: customer._id,
      company: req.company._id,
    })
      .populate('package', 'name description totalSessions')
      .sort({ purchaseDate: -1 });

    res.json({
      success: true,
      data: { packages },
    });
  } catch (error) {
    console.error('Get customer packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/v1/customers/:id/notes
// @desc    Add note to customer
// @access  Private
router.post('/:id/notes', authenticate, checkPermission('customers', 'edit'), [
  body('note').trim().isLength({ min: 1, max: 1000 }).withMessage('Note must be between 1 and 1000 characters'),
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

    const customer = await Customer.findOne({
      _id: req.params.id,
      company: req.company._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    const { note } = req.body;
    const timestamp = new Date().toISOString();
    const staffName = `${req.user.firstName} ${req.user.lastName}`;
    
    const formattedNote = `[${timestamp}] ${staffName}: ${note}`;
    
    if (customer.notes) {
      customer.notes += `\n${formattedNote}`;
    } else {
      customer.notes = formattedNote;
    }

    await customer.save();

    res.json({
      success: true,
      message: 'Note added successfully',
      data: { customer },
    });
  } catch (error) {
    console.error('Add customer note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
