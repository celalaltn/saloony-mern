const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'],
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  preferences: {
    preferredStaff: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    allergies: [String],
    skinType: {
      type: String,
      enum: ['normal', 'dry', 'oily', 'combination', 'sensitive'],
    },
    hairType: {
      type: String,
      enum: ['straight', 'wavy', 'curly', 'coily'],
    },
    communicationPreference: {
      type: String,
      enum: ['email', 'sms', 'both', 'none'],
      default: 'both',
    },
  },
  visitHistory: {
    firstVisit: Date,
    lastVisit: Date,
    totalVisits: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
  },
  tags: [String], // e.g., 'VIP', 'Regular', 'New'
  isActive: {
    type: Boolean,
    default: true,
  },
  blacklisted: {
    type: Boolean,
    default: false,
  },
  blacklistReason: String,
}, {
  timestamps: true,
});

// Indexes
customerSchema.index({ company: 1, phone: 1 }, { unique: true });
customerSchema.index({ company: 1, email: 1 });
customerSchema.index({ company: 1, isActive: 1 });
customerSchema.index({ company: 1, 'visitHistory.lastVisit': -1 });

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
customerSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Method to update visit history
customerSchema.methods.updateVisitHistory = function(amount = 0) {
  if (!this.visitHistory.firstVisit) {
    this.visitHistory.firstVisit = new Date();
  }
  this.visitHistory.lastVisit = new Date();
  this.visitHistory.totalVisits += 1;
  this.visitHistory.totalSpent += amount;
};

// Method to add loyalty points
customerSchema.methods.addLoyaltyPoints = function(points) {
  this.loyaltyPoints += points;
};

module.exports = mongoose.model('Customer', customerSchema);
