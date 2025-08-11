const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  category: {
    type: String,
    required: true,
    enum: [
      'hair_cut', 'hair_color', 'hair_styling', 'hair_treatment',
      'nail_manicure', 'nail_pedicure', 'nail_art', 'nail_extension',
      'facial', 'skincare', 'massage', 'waxing', 'eyebrow', 'eyelash',
      'makeup', 'beard_trim', 'shaving', 'laser_treatment', 'other'
    ],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
  },
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  requirements: {
    preparation: String, // e.g., "Come with clean hair"
    aftercare: String, // e.g., "Avoid water for 24 hours"
  },
  images: [String], // Cloudinary URLs
  isActive: {
    type: Boolean,
    default: true,
  },
  bookingSettings: {
    advanceBookingDays: {
      type: Number,
      default: 30,
    },
    cancellationHours: {
      type: Number,
      default: 24,
    },
    maxBookingsPerDay: {
      type: Number,
      default: 10,
    },
  },
  loyaltyPoints: {
    type: Number,
    default: 0, // Points earned per service
  },
}, {
  timestamps: true,
});

// Indexes
serviceSchema.index({ company: 1, category: 1 });
serviceSchema.index({ company: 1, isActive: 1 });
serviceSchema.index({ company: 1, name: 'text', description: 'text' });

// Virtual for formatted price
serviceSchema.virtual('formattedPrice').get(function() {
  return `${this.price.toFixed(2)} ₺`;
});

// Virtual for formatted duration
serviceSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
});

module.exports = mongoose.model('Service', serviceSchema);
