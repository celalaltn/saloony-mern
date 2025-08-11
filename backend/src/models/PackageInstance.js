const mongoose = require('mongoose');

const packageInstanceSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  totalSessions: {
    type: Number,
    required: true,
  },
  usedSessions: {
    type: Number,
    default: 0,
  },
  remainingSessions: {
    type: Number,
    required: true,
  },
  sessionHistory: [{
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
  }],
  status: {
    type: String,
    enum: ['active', 'expired', 'completed', 'cancelled'],
    default: 'active',
  },
  paidAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'online'],
    required: true,
  },
  notes: String,
}, {
  timestamps: true,
});

// Indexes
packageInstanceSchema.index({ company: 1, customer: 1 });
packageInstanceSchema.index({ company: 1, status: 1 });
packageInstanceSchema.index({ company: 1, expiryDate: 1 });

// Virtual for progress percentage
packageInstanceSchema.virtual('progressPercentage').get(function() {
  return Math.round((this.usedSessions / this.totalSessions) * 100);
});

// Virtual for checking if expired
packageInstanceSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Method to use a session
packageInstanceSchema.methods.useSession = function(appointmentId, serviceId, staffId, notes = '') {
  if (this.remainingSessions <= 0) {
    throw new Error('No remaining sessions');
  }
  
  if (this.isExpired) {
    throw new Error('Package has expired');
  }

  this.usedSessions += 1;
  this.remainingSessions -= 1;
  
  this.sessionHistory.push({
    appointment: appointmentId,
    service: serviceId,
    staff: staffId,
    notes,
    usedAt: new Date(),
  });

  // Update status if all sessions used or expired
  if (this.remainingSessions === 0) {
    this.status = 'completed';
  } else if (this.isExpired) {
    this.status = 'expired';
  }
};

// Method to refund a session
packageInstanceSchema.methods.refundSession = function(sessionIndex) {
  if (sessionIndex < 0 || sessionIndex >= this.sessionHistory.length) {
    throw new Error('Invalid session index');
  }

  this.sessionHistory.splice(sessionIndex, 1);
  this.usedSessions -= 1;
  this.remainingSessions += 1;

  // Update status back to active if was completed
  if (this.status === 'completed' && this.remainingSessions > 0) {
    this.status = 'active';
  }
};

// Pre-save middleware to update remaining sessions
packageInstanceSchema.pre('save', function(next) {
  if (this.isModified('usedSessions') || this.isModified('totalSessions')) {
    this.remainingSessions = this.totalSessions - this.usedSessions;
  }
  next();
});

module.exports = mongoose.model('PackageInstance', packageInstanceSchema);
