const express = require('express');
const { authenticate } = require('../middleware/auth');
const NotificationLog = require('../models/NotificationLog');

const router = express.Router();

// @route   GET /api/v1/notifications
// @desc    Get notification logs
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    
    const filter = { company: req.company._id };
    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const notifications = await NotificationLog.find(filter)
      .populate('recipient.customer', 'firstName lastName')
      .populate('recipient.user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NotificationLog.countDocuments(filter);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
