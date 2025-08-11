const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },
  phone: {
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'],
  },
  role: {
    type: String,
    enum: ['admin', 'staff'],
    required: true,
  },
  avatar: {
    type: String, // Cloudinary URL
  },
  permissions: {
    appointments: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: true },
      edit: { type: Boolean, default: true },
      delete: { type: Boolean, default: false },
    },
    customers: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: true },
      edit: { type: Boolean, default: true },
      delete: { type: Boolean, default: false },
    },
    services: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    packages: {
      view: { type: Boolean, default: true },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    transactions: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    staff: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
    reports: {
      view: { type: Boolean, default: false },
    },
  },
  workSchedule: {
    monday: { start: String, end: String, available: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, available: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, available: { type: Boolean, default: true } },
    thursday: { start: String, end: String, available: { type: Boolean, default: true } },
    friday: { start: String, end: String, available: { type: Boolean, default: true } },
    saturday: { start: String, end: String, available: { type: Boolean, default: true } },
    sunday: { start: String, end: String, available: { type: Boolean, default: false } },
  },
  specializations: [{
    type: String, // e.g., 'hair_cut', 'nail_art', 'massage'
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
  }],
}, {
  timestamps: true,
});

// Indexes
userSchema.index({ company: 1, email: 1 });
userSchema.index({ company: 1, role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to set admin permissions
userSchema.methods.setAdminPermissions = function() {
  this.permissions = {
    appointments: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    services: { view: true, create: true, edit: true, delete: true },
    packages: { view: true, create: true, edit: true, delete: true },
    transactions: { view: true, create: true, edit: true, delete: true },
    staff: { view: true, create: true, edit: true, delete: true },
    reports: { view: true },
  };
};

// Method to clean expired refresh tokens
userSchema.methods.cleanExpiredTokens = function() {
  this.refreshTokens = this.refreshTokens.filter(
    tokenObj => tokenObj.expiresAt > new Date()
  );
};

module.exports = mongoose.model('User', userSchema);
