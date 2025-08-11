const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'],
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Turkey',
    },
  },
  businessType: {
    type: String,
    enum: ['salon', 'barbershop', 'spa', 'clinic'],
    required: true,
  },
  logo: {
    type: String, // Cloudinary URL
  },
  settings: {
    timezone: {
      type: String,
      default: 'Europe/Istanbul',
    },
    currency: {
      type: String,
      default: 'TRY',
    },
    workingHours: {
      monday: { start: String, end: String, closed: { type: Boolean, default: false } },
      tuesday: { start: String, end: String, closed: { type: Boolean, default: false } },
      wednesday: { start: String, end: String, closed: { type: Boolean, default: false } },
      thursday: { start: String, end: String, closed: { type: Boolean, default: false } },
      friday: { start: String, end: String, closed: { type: Boolean, default: false } },
      saturday: { start: String, end: String, closed: { type: Boolean, default: false } },
      sunday: { start: String, end: String, closed: { type: Boolean, default: true } },
    },
    appointmentDuration: {
      type: Number,
      default: 30, // minutes
    },
    advanceBookingDays: {
      type: Number,
      default: 30,
    },
    cancellationPolicy: {
      type: String,
      default: '24 hours notice required',
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      reminderHours: { type: Number, default: 24 },
    },
  },
  subscription: {
    plan: {
      type: String,
      enum: ['trial', 'basic', 'premium'],
      default: 'trial',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due'],
      default: 'active',
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    trialEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
companySchema.index({ email: 1 });
companySchema.index({ 'subscription.status': 1 });
companySchema.index({ isActive: 1 });

// Virtual for checking if trial is expired
companySchema.virtual('isTrialExpired').get(function() {
  return this.subscription.plan === 'trial' && new Date() > this.subscription.trialEnd;
});

// Method to check if company has active subscription
companySchema.methods.hasActiveSubscription = function() {
  if (this.subscription.plan === 'trial') {
    return new Date() <= this.subscription.trialEnd;
  }
  return this.subscription.status === 'active';
};

module.exports = mongoose.model('Company', companySchema);
