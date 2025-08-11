const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticate, checkPermission } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const User = require('../models/User');
const PackageInstance = require('../models/PackageInstance');
const { emitToCompany } = require('../config/socket');

const router = express.Router();

// @route   GET /api/v1/appointments
// @desc    Get appointments with filters
// @access  Private
router.get('/', authenticate, checkPermission('appointments', 'view'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  query('staff').optional().isMongoId().withMessage('Invalid staff ID'),
  query('customer').optional().isMongoId().withMessage('Invalid customer ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
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
      status,
      staff,
      customer,
      startDate,
      endDate,
      search,
    } = req.query;

    // Build filter
    const filter = { company: req.company._id };

    if (status) filter.status = status;
    if (staff) filter.staff = staff;
    if (customer) filter.customer = customer;

    if (startDate || endDate) {
      filter.dateTime = {};
      if (startDate) filter.dateTime.$gte = new Date(startDate);
      if (endDate) filter.dateTime.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get appointments
    const appointments = await Appointment.find(filter)
      .populate('customer', 'firstName lastName phone email')
      .populate('staff', 'firstName lastName')
      .populate('services.service', 'name price duration category')
      .sort({ dateTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

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
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/v1/appointments/:id
// @desc    Get single appointment
// @access  Private
router.get('/:id', authenticate, checkPermission('appointments', 'view'), async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      company: req.company._id,
    })
      .populate('customer')
      .populate('staff', 'firstName lastName phone email')
      .populate('services.service')
      .populate('services.packageInstance');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    res.json({
      success: true,
      data: { appointment },
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/v1/appointments
// @desc    Create new appointment
// @access  Private
router.post('/', authenticate, checkPermission('appointments', 'create'), [
  body('customer').isMongoId().withMessage('Valid customer ID is required'),
  body('staff').isMongoId().withMessage('Valid staff ID is required'),
  body('services').isArray({ min: 1 }).withMessage('At least one service is required'),
  body('services.*.service').isMongoId().withMessage('Valid service ID is required'),
  body('dateTime').isISO8601().withMessage('Valid date and time is required'),
  body('notes.customer').optional().isLength({ max: 500 }).withMessage('Customer notes cannot exceed 500 characters'),
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

    const { customer, staff, services, dateTime, notes, paymentMethod } = req.body;

    // Verify customer belongs to company
    const customerDoc = await Customer.findOne({
      _id: customer,
      company: req.company._id,
    });

    if (!customerDoc) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Verify staff belongs to company
    const staffDoc = await User.findOne({
      _id: staff,
      company: req.company._id,
      role: { $in: ['admin', 'staff'] },
    });

    if (!staffDoc) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found',
      });
    }

    // Process services and calculate total duration and amount
    const processedServices = [];
    let totalDuration = 0;
    let totalAmount = 0;

    for (const serviceItem of services) {
      const service = await Service.findOne({
        _id: serviceItem.service,
        company: req.company._id,
        isActive: true,
      });

      if (!service) {
        return res.status(404).json({
          success: false,
          message: `Service not found: ${serviceItem.service}`,
        });
      }

      let isPackageSession = false;
      let packageInstance = null;

      // Check if using package session
      if (serviceItem.packageInstanceId) {
        packageInstance = await PackageInstance.findOne({
          _id: serviceItem.packageInstanceId,
          customer: customer,
          company: req.company._id,
          status: 'active',
        });

        if (packageInstance && packageInstance.remainingSessions > 0) {
          isPackageSession = true;
        }
      }

      processedServices.push({
        service: service._id,
        price: service.price,
        duration: service.duration,
        packageInstance: packageInstance?._id,
        isPackageSession,
      });

      totalDuration += service.duration;
      if (!isPackageSession) {
        totalAmount += service.price;
      }
    }

    // Check for scheduling conflicts
    const appointmentStart = new Date(dateTime);
    const appointmentEnd = new Date(appointmentStart.getTime() + totalDuration * 60000);

    const conflictingAppointment = await Appointment.findOne({
      company: req.company._id,
      staff: staff,
      status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
      $or: [
        {
          dateTime: { $lt: appointmentEnd },
          endTime: { $gt: appointmentStart },
        },
      ],
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Staff member is not available at the selected time',
      });
    }

    // Create appointment
    const appointment = new Appointment({
      company: req.company._id,
      customer,
      staff,
      services: processedServices,
      dateTime: appointmentStart,
      duration: totalDuration,
      totalAmount,
      notes,
      paymentMethod,
    });

    await appointment.save();

    // Use package sessions if applicable
    for (let i = 0; i < processedServices.length; i++) {
      if (processedServices[i].isPackageSession) {
        const packageInstance = await PackageInstance.findById(processedServices[i].packageInstance);
        packageInstance.useSession(
          appointment._id,
          processedServices[i].service,
          staff,
          `Appointment on ${appointmentStart.toLocaleDateString()}`
        );
        await packageInstance.save();
      }
    }

    // Populate for response
    await appointment.populate([
      { path: 'customer', select: 'firstName lastName phone email' },
      { path: 'staff', select: 'firstName lastName' },
      { path: 'services.service', select: 'name price duration category' },
    ]);

    // Emit real-time update
    emitToCompany(req.company._id, 'appointment:created', {
      appointment,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment },
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   PUT /api/v1/appointments/:id
// @desc    Update appointment
// @access  Private
router.put('/:id', authenticate, checkPermission('appointments', 'edit'), [
  body('dateTime').optional().isISO8601().withMessage('Valid date and time is required'),
  body('status').optional().isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']),
  body('notes.staff').optional().isLength({ max: 500 }).withMessage('Staff notes cannot exceed 500 characters'),
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

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      company: req.company._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    const { dateTime, status, notes, paidAmount, paymentMethod } = req.body;

    // Update fields
    if (dateTime) {
      // Check for conflicts if rescheduling
      const newStart = new Date(dateTime);
      const newEnd = new Date(newStart.getTime() + appointment.duration * 60000);

      const conflictingAppointment = await Appointment.findOne({
        _id: { $ne: appointment._id },
        company: req.company._id,
        staff: appointment.staff,
        status: { $in: ['scheduled', 'confirmed', 'in_progress'] },
        $or: [
          {
            dateTime: { $lt: newEnd },
            endTime: { $gt: newStart },
          },
        ],
      });

      if (conflictingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'Staff member is not available at the selected time',
        });
      }

      appointment.dateTime = newStart;
    }

    if (status) appointment.status = status;
    if (notes) appointment.notes = { ...appointment.notes, ...notes };
    if (paidAmount !== undefined) appointment.paidAmount = paidAmount;
    if (paymentMethod) appointment.paymentMethod = paymentMethod;

    // Update payment status based on paid amount
    if (paidAmount !== undefined) {
      if (paidAmount === 0) {
        appointment.paymentStatus = 'pending';
      } else if (paidAmount < appointment.totalAmount) {
        appointment.paymentStatus = 'partial';
      } else {
        appointment.paymentStatus = 'paid';
      }
    }

    await appointment.save();

    // Populate for response
    await appointment.populate([
      { path: 'customer', select: 'firstName lastName phone email' },
      { path: 'staff', select: 'firstName lastName' },
      { path: 'services.service', select: 'name price duration category' },
    ]);

    // Emit real-time update
    emitToCompany(req.company._id, 'appointment:updated', {
      appointment,
      updatedBy: req.user._id,
    });

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment },
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   DELETE /api/v1/appointments/:id
// @desc    Cancel appointment
// @access  Private
router.delete('/:id', authenticate, checkPermission('appointments', 'delete'), async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      company: req.company._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Check if appointment can be cancelled
    if (!appointment.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment cannot be cancelled (less than 24 hours notice or already completed)',
      });
    }

    // Update appointment status
    appointment.status = 'cancelled';
    appointment.cancellation = {
      cancelledBy: req.user.role,
      cancelledAt: new Date(),
      reason: req.body.reason || 'Cancelled by staff',
    };

    await appointment.save();

    // Refund package sessions if applicable
    for (const serviceItem of appointment.services) {
      if (serviceItem.isPackageSession && serviceItem.packageInstance) {
        const packageInstance = await PackageInstance.findById(serviceItem.packageInstance);
        if (packageInstance) {
          // Find and refund the session
          const sessionIndex = packageInstance.sessionHistory.findIndex(
            session => session.appointment.toString() === appointment._id.toString()
          );
          if (sessionIndex !== -1) {
            packageInstance.refundSession(sessionIndex);
            await packageInstance.save();
          }
        }
      }
    }

    // Emit real-time update
    emitToCompany(req.company._id, 'appointment:cancelled', {
      appointmentId: appointment._id,
      cancelledBy: req.user._id,
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/v1/appointments/calendar
// @desc    Get calendar view of appointments
// @access  Private
router.get('/calendar', authenticate, checkPermission('appointments', 'view'), [
  query('start').isISO8601().withMessage('Valid start date is required'),
  query('end').isISO8601().withMessage('Valid end date is required'),
  query('staff').optional().isMongoId().withMessage('Invalid staff ID'),
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

    const { start, end, staff } = req.query;

    const filter = {
      company: req.company._id,
      dateTime: {
        $gte: new Date(start),
        $lte: new Date(end),
      },
      status: { $ne: 'cancelled' },
    };

    if (staff) filter.staff = staff;

    const appointments = await Appointment.find(filter)
      .populate('customer', 'firstName lastName')
      .populate('staff', 'firstName lastName')
      .populate('services.service', 'name category')
      .select('dateTime endTime status totalAmount services customer staff')
      .sort({ dateTime: 1 });

    // Format for calendar
    const calendarEvents = appointments.map(appointment => ({
      id: appointment._id,
      title: `${appointment.customer.firstName} ${appointment.customer.lastName}`,
      start: appointment.dateTime,
      end: appointment.endTime,
      status: appointment.status,
      staff: appointment.staff,
      services: appointment.services.map(s => s.service.name).join(', '),
      amount: appointment.totalAmount,
    }));

    res.json({
      success: true,
      data: { events: calendarEvents },
    });
  } catch (error) {
    console.error('Get calendar appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
