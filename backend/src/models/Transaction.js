const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      // Income categories
      'service_payment', 'package_sale', 'product_sale', 'tip', 'other_income',
      // Expense categories
      'rent', 'utilities', 'supplies', 'equipment', 'marketing', 'staff_salary',
      'insurance', 'maintenance', 'training', 'software', 'other_expense'
    ],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'online', 'check'],
    required: true,
  },
  reference: {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    invoiceNumber: String,
    receiptNumber: String,
  },
  tags: [String],
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  attachments: [String], // Cloudinary URLs for receipts/invoices
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    interval: Number, // e.g., every 2 weeks
    endDate: Date,
    nextDue: Date,
  },
}, {
  timestamps: true,
});

// Indexes
transactionSchema.index({ company: 1, date: -1 });
transactionSchema.index({ company: 1, type: 1, date: -1 });
transactionSchema.index({ company: 1, category: 1, date: -1 });
transactionSchema.index({ 'reference.appointment': 1 });
transactionSchema.index({ 'reference.customer': 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return `${this.amount.toFixed(2)} ₺`;
});

// Static method to get monthly summary
transactionSchema.statics.getMonthlySummary = function(companyId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        categories: {
          $push: {
            category: '$category',
            amount: '$amount'
          }
        }
      }
    }
  ]);
};

// Static method to get category breakdown
transactionSchema.statics.getCategoryBreakdown = function(companyId, startDate, endDate, type) {
  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        type: type,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);
