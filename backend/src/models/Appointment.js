const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  services: [{
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    price: Number, // Price at time of booking
    duration: Number, // Duration at time of booking
    packageInstance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PackageInstance',
    },
    isPackageSession: {
      type: Boolean,
      default: false,
    },
  }],
  dateTime: {
    type: Date,
    required: [true, 'Appointment date and time is required'],
  },
  endTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number, // Total duration in minutes
    required: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled',
  },
  notes: {
    customer: String, // Notes from customer
    staff: String, // Notes from staff
    internal: String, // Internal notes
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'online', 'package'],
  },
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['customer', 'staff', 'admin'],
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  reminders: {
    sent: [{
      type: {
        type: String,
        enum: ['email', 'sms'],
      },
      sentAt: Date,
      status: {
        type: String,
        enum: ['sent', 'delivered', 'failed'],
      },
    }],
    nextReminder: Date,
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    submittedAt: Date,
  },
}, {
  timestamps: true,
});

// Indexes
appointmentSchema.index({ company: 1, dateTime: 1 });
appointmentSchema.index({ company: 1, customer: 1, dateTime: -1 });
appointmentSchema.index({ company: 1, staff: 1, dateTime: 1 });
appointmentSchema.index({ company: 1, status: 1 });
appointmentSchema.index({ dateTime: 1, status: 1 });

// Virtual for checking if appointment is today
appointmentSchema.virtual('isToday').get(function() {
  const today = new Date();
  const appointmentDate = new Date(this.dateTime);
  return today.toDateString() === appointmentDate.toDateString();
});

// Virtual for checking if appointment is upcoming
appointmentSchema.virtual('isUpcoming').get(function() {
  return new Date() < this.dateTime && this.status === 'scheduled';
});

// Virtual for checking if appointment is overdue
appointmentSchema.virtual('isOverdue').get(function() {
  return new Date() > this.endTime && ['scheduled', 'confirmed'].includes(this.status);
});

// Method to calculate total amount
appointmentSchema.methods.calculateTotal = function() {
  this.totalAmount = this.services.reduce((total, serviceItem) => {
    return total + (serviceItem.isPackageSession ? 0 : serviceItem.price);
  }, 0);
  return this.totalAmount;
};

// Method to check if can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const hoursUntilAppointment = (this.dateTime - now) / (1000 * 60 * 60);
  return hoursUntilAppointment >= 24 && ['scheduled', 'confirmed'].includes(this.status);
};

// Pre-save middleware to calculate end time and total
appointmentSchema.pre('save', function(next) {
  if (this.isModified('dateTime') || this.isModified('duration')) {
    this.endTime = new Date(this.dateTime.getTime() + this.duration * 60000);
  }
  
  if (this.isModified('services')) {
    this.calculateTotal();
    this.duration = this.services.reduce((total, serviceItem) => {
      return total + serviceItem.duration;
    }, 0);
  }
  
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
