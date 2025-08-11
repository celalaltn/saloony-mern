const express = require('express');
const { authenticate, checkPermission } = require('../middleware/auth');
const Package = require('../models/Package');
const PackageInstance = require('../models/PackageInstance');

const router = express.Router();

// @route   GET /api/v1/packages
// @desc    Get all packages
// @access  Private
router.get('/', authenticate, checkPermission('packages', 'view'), async (req, res) => {
  try {
    const packages = await Package.find({ 
      company: req.company._id,
      isActive: true 
    }).populate('services.service', 'name price duration');

    res.json({
      success: true,
      data: { packages },
    });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
