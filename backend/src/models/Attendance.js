const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  checkIn: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
    },
    method: {
      type: String,
      enum: ['manual', 'qr_code', 'biometric', 'admin'],
      default: 'manual',
    },
  },
  checkOut: {
    time: Date,
    location: {
      latitude: Number,
      longitude: Number,
    },
    method: {
      type: String,
      enum: ['manual', 'qr_code', 'biometric', 'admin'],
      default: 'manual',
    },
  },
  breaks: [{
    startTime: Date,
    endTime: Date,
    reason: String,
  }],
  totalHours: {
    type: Number,
    default: 0,
  },
  overtimeHours: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half_day', 'sick_leave', 'vacation'],
    default: 'present',
  },
  notes: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
}, {
  timestamps: true,
});

// Indexes
attendanceSchema.index({ company: 1, user: 1, date: -1 });
attendanceSchema.index({ company: 1, date: -1 });
attendanceSchema.index({ user: 1, date: -1 });

// Compound unique index to prevent duplicate attendance records
attendanceSchema.index({ company: 1, user: 1, date: 1 }, { unique: true });

// Virtual for checking if user is currently checked in
attendanceSchema.virtual('isCheckedIn').get(function() {
  return this.checkIn.time && !this.checkOut.time;
});

// Method to calculate total hours worked
attendanceSchema.methods.calculateHours = function() {
  if (!this.checkIn.time || !this.checkOut.time) {
    this.totalHours = 0;
    return 0;
  }

  let totalMinutes = (this.checkOut.time - this.checkIn.time) / (1000 * 60);
  
  // Subtract break time
  const breakMinutes = this.breaks.reduce((total, breakItem) => {
    if (breakItem.startTime && breakItem.endTime) {
      return total + ((breakItem.endTime - breakItem.startTime) / (1000 * 60));
    }
    return total;
  }, 0);

  totalMinutes -= breakMinutes;
  this.totalHours = Math.max(0, totalMinutes / 60);

  // Calculate overtime (assuming 8 hours is regular work day)
  this.overtimeHours = Math.max(0, this.totalHours - 8);

  return this.totalHours;
};

// Static method to get monthly attendance summary
attendanceSchema.statics.getMonthlySummary = function(companyId, userId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        user: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        totalHours: { $sum: '$totalHours' },
        totalOvertimeHours: { $sum: '$overtimeHours' },
        presentDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
          }
        },
        absentDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
          }
        },
        lateDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Pre-save middleware to calculate hours
attendanceSchema.pre('save', function(next) {
  this.calculateHours();
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
