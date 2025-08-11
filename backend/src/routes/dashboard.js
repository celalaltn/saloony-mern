const express = require('express');
const { authenticate } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/v1/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Today's appointments
    const todayAppointments = await Appointment.countDocuments({
      company: req.company._id,
      dateTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    });

    // This month's revenue
    const monthlyRevenue = await Transaction.aggregate([
      {
        $match: {
          company: req.company._id,
          type: 'income',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Total customers
    const totalCustomers = await Customer.countDocuments({
      company: req.company._id,
      isActive: true
    });

    // Active staff
    const activeStaff = await User.countDocuments({
      company: req.company._id,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        todayAppointments,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        totalCustomers,
        activeStaff
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
