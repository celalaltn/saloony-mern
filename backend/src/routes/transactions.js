const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const Transaction = require('../models/Transaction');

const router = express.Router();

// @route   GET /api/v1/transactions
// @desc    Get all transactions
// @access  Private
router.get('/', authenticate, checkPermission('transactions', 'view'), async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, startDate, endDate } = req.query;
    
    const filter = { company: req.company._id };
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const transactions = await Transaction.find(filter)
      .populate('reference.customer', 'firstName lastName')
      .populate('reference.staff', 'firstName lastName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
