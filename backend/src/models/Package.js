const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Package name is required'],
    trim: true,
    maxlength: [100, 'Package name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  services: [{
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    sessionsIncluded: {
      type: Number,
      required: true,
      min: [1, 'Sessions must be at least 1'],
    },
  }],
  totalSessions: {
    type: Number,
    required: [true, 'Total sessions is required'],
    min: [1, 'Total sessions must be at least 1'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  originalPrice: {
    type: Number, // Sum of individual service prices
  },
  validityPeriod: {
    type: Number, // in days
    required: [true, 'Validity period is required'],
    min: [1, 'Validity period must be at least 1 day'],
  },
  images: [String], // Cloudinary URLs
  isActive: {
    type: Boolean,
    default: true,
  },
  terms: {
    type: String,
    maxlength: [1000, 'Terms cannot exceed 1000 characters'],
  },
}, {
  timestamps: true,
});

// Indexes
packageSchema.index({ company: 1, isActive: 1 });
packageSchema.index({ company: 1, name: 'text', description: 'text' });

// Virtual for discount percentage
packageSchema.virtual('discountPercentage').get(function() {
  if (!this.originalPrice || this.originalPrice === 0) return 0;
  return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
});

// Virtual for savings amount
packageSchema.virtual('savings').get(function() {
  if (!this.originalPrice) return 0;
  return this.originalPrice - this.price;
});

// Pre-save middleware to calculate original price
packageSchema.pre('save', async function(next) {
  if (this.isModified('services')) {
    try {
      await this.populate('services.service');
      this.originalPrice = this.services.reduce((total, item) => {
        return total + (item.service.price * item.sessionsIncluded);
      }, 0);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Package', packageSchema);
