const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  recipient: {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    email: String,
    phone: String,
  },
  type: {
    type: String,
    enum: ['email', 'sms'],
    required: true,
  },
  purpose: {
    type: String,
    enum: [
      'appointment_reminder', 'appointment_confirmation', 'appointment_cancellation',
      'package_expiry_warning', 'birthday_greeting', 'promotion', 'welcome',
      'payment_reminder', 'feedback_request', 'staff_notification'
    ],
    required: true,
  },
  subject: String, // For emails
  content: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
    default: 'pending',
  },
  sentAt: Date,
  deliveredAt: Date,
  failureReason: String,
  reference: {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    packageInstance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PackageInstance',
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  },
  metadata: {
    provider: String, // 'sendgrid', 'twilio'
    messageId: String, // External provider message ID
    cost: Number, // Cost of sending the notification
  },
}, {
  timestamps: true,
});

// Indexes
notificationLogSchema.index({ company: 1, createdAt: -1 });
notificationLogSchema.index({ company: 1, status: 1 });
notificationLogSchema.index({ company: 1, type: 1, purpose: 1 });
notificationLogSchema.index({ 'recipient.customer': 1 });
notificationLogSchema.index({ 'reference.appointment': 1 });

// Static method to get notification stats
notificationLogSchema.statics.getStats = function(companyId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          type: '$type',
          status: '$status'
        },
        count: { $sum: 1 },
        totalCost: { $sum: '$metadata.cost' }
      }
    }
  ]);
};

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
