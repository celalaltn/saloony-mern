const { Queue, Worker } = require('bullmq');
const { getRedisClient } = require('../config/redis');
const notificationService = require('./notificationService');
const Appointment = require('../models/Appointment');
const PackageInstance = require('../models/PackageInstance');
const cron = require('node-cron');

class JobService {
  constructor() {
    this.queues = {};
    this.workers = {};
    this.initialized = false;
  }

  async initialize() {
    // Skip initialization in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log('Development mode: Using mock job service');
      this.initialized = true;
      return;
    }
    
    if (this.initialized) return;

    try {
      const redis = getRedisClient();

      // Create queues
      this.queues.notifications = new Queue('notifications', {
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      this.queues.appointments = new Queue('appointments', {
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      });

      this.queues.packages = new Queue('packages', {
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      });

      // Create workers
      this.createWorkers();

      // Set up cron jobs
      this.setupCronJobs();

      this.initialized = true;
      console.log('✅ Job service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize job service:', error);
      throw error;
    }
  }

  createWorkers() {
    const redis = getRedisClient();

    // Notifications worker
    this.workers.notifications = new Worker(
      'notifications',
      async (job) => {
        const { type, data } = job.data;

        switch (type) {
          case 'appointment_reminder':
            await notificationService.sendAppointmentReminder(data.appointment);
            break;
          case 'appointment_confirmation':
            await notificationService.sendAppointmentConfirmation(data.appointment);
            break;
          case 'package_expiry_warning':
            await notificationService.sendPackageExpiryWarning(data.packageInstance);
            break;
          case 'send_email':
            await notificationService.sendEmail(data);
            break;
          case 'send_sms':
            await notificationService.sendSMS(data);
            break;
          default:
            throw new Error(`Unknown notification type: ${type}`);
        }
      },
      {
        connection: redis,
        concurrency: 5,
      }
    );

    // Appointments worker
    this.workers.appointments = new Worker(
      'appointments',
      async (job) => {
        const { type, data } = job.data;

        switch (type) {
          case 'send_reminders':
            await this.processAppointmentReminders();
            break;
          case 'update_status':
            await this.updateAppointmentStatuses();
            break;
          default:
            throw new Error(`Unknown appointment job type: ${type}`);
        }
      },
      {
        connection: redis,
        concurrency: 2,
      }
    );

    // Packages worker
    this.workers.packages = new Worker(
      'packages',
      async (job) => {
        const { type, data } = job.data;

        switch (type) {
          case 'check_expiry':
            await this.checkPackageExpiry();
            break;
          case 'send_expiry_warnings':
            await this.sendPackageExpiryWarnings();
            break;
          default:
            throw new Error(`Unknown package job type: ${type}`);
        }
      },
      {
        connection: redis,
        concurrency: 2,
      }
    );

    // Error handling
    Object.values(this.workers).forEach(worker => {
      worker.on('failed', (job, err) => {
        console.error(`Job ${job.id} failed:`, err);
      });

      worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed successfully`);
      });
    });
  }

  setupCronJobs() {
    // Send appointment reminders every hour
    cron.schedule('0 * * * *', async () => {
      try {
        await this.queues.appointments.add('send_reminders', {
          type: 'send_reminders',
        });
      } catch (error) {
        console.error('Error scheduling appointment reminders:', error);
      }
    });

    // Update appointment statuses every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      try {
        await this.queues.appointments.add('update_status', {
          type: 'update_status',
        });
      } catch (error) {
        console.error('Error scheduling appointment status updates:', error);
      }
    });

    // Check package expiry daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      try {
        await this.queues.packages.add('check_expiry', {
          type: 'check_expiry',
        });
      } catch (error) {
        console.error('Error scheduling package expiry check:', error);
      }
    });

    // Send package expiry warnings daily at 10 AM
    cron.schedule('0 10 * * *', async () => {
      try {
        await this.queues.packages.add('send_expiry_warnings', {
          type: 'send_expiry_warnings',
        });
      } catch (error) {
        console.error('Error scheduling package expiry warnings:', error);
      }
    });
  }

  // Queue appointment reminder
  async queueAppointmentReminder(appointment, delayInMs = 0) {
    try {
      await this.queues.notifications.add(
        'appointment_reminder',
        {
          type: 'appointment_reminder',
          data: { appointment },
        },
        {
          delay: delayInMs,
          jobId: `reminder_${appointment._id}`,
        }
      );
    } catch (error) {
      console.error('Error queueing appointment reminder:', error);
      throw error;
    }
  }

  // Queue appointment confirmation
  async queueAppointmentConfirmation(appointment) {
    try {
      await this.queues.notifications.add(
        'appointment_confirmation',
        {
          type: 'appointment_confirmation',
          data: { appointment },
        },
        {
          jobId: `confirmation_${appointment._id}`,
        }
      );
    } catch (error) {
      console.error('Error queueing appointment confirmation:', error);
      throw error;
    }
  }

  // Process appointment reminders
  async processAppointmentReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Find appointments for tomorrow that haven't been reminded
      const appointments = await Appointment.find({
        dateTime: {
          $gte: tomorrow,
          $lt: dayAfterTomorrow,
        },
        status: { $in: ['scheduled', 'confirmed'] },
        'reminders.nextReminder': { $lte: new Date() },
      })
        .populate('customer')
        .populate('staff', 'firstName lastName')
        .populate('company')
        .populate('services.service', 'name');

      for (const appointment of appointments) {
        try {
          await notificationService.sendAppointmentReminder(appointment);
          
          // Update reminder status
          appointment.reminders.sent.push({
            type: 'email',
            sentAt: new Date(),
            status: 'sent',
          });
          appointment.reminders.nextReminder = null;
          await appointment.save();
        } catch (error) {
          console.error(`Error sending reminder for appointment ${appointment._id}:`, error);
        }
      }

      console.log(`Processed ${appointments.length} appointment reminders`);
    } catch (error) {
      console.error('Error processing appointment reminders:', error);
      throw error;
    }
  }

  // Update appointment statuses
  async updateAppointmentStatuses() {
    try {
      const now = new Date();
      
      // Mark overdue appointments as no-show
      const overdueAppointments = await Appointment.updateMany(
        {
          endTime: { $lt: now },
          status: { $in: ['scheduled', 'confirmed'] },
        },
        {
          $set: { status: 'no_show' },
        }
      );

      console.log(`Updated ${overdueAppointments.modifiedCount} overdue appointments to no-show`);
    } catch (error) {
      console.error('Error updating appointment statuses:', error);
      throw error;
    }
  }

  // Check package expiry
  async checkPackageExpiry() {
    try {
      const now = new Date();
      
      // Mark expired packages
      const expiredPackages = await PackageInstance.updateMany(
        {
          expiryDate: { $lt: now },
          status: 'active',
        },
        {
          $set: { status: 'expired' },
        }
      );

      console.log(`Marked ${expiredPackages.modifiedCount} packages as expired`);
    } catch (error) {
      console.error('Error checking package expiry:', error);
      throw error;
    }
  }

  // Send package expiry warnings
  async sendPackageExpiryWarnings() {
    try {
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 7); // 7 days before expiry

      // Find packages expiring in 7 days
      const expiringPackages = await PackageInstance.find({
        expiryDate: {
          $gte: new Date(),
          $lte: warningDate,
        },
        status: 'active',
        remainingSessions: { $gt: 0 },
      })
        .populate('customer')
        .populate('company')
        .populate('package', 'name');

      for (const packageInstance of expiringPackages) {
        try {
          await notificationService.sendPackageExpiryWarning(packageInstance);
        } catch (error) {
          console.error(`Error sending expiry warning for package ${packageInstance._id}:`, error);
        }
      }

      console.log(`Sent ${expiringPackages.length} package expiry warnings`);
    } catch (error) {
      console.error('Error sending package expiry warnings:', error);
      throw error;
    }
  }

  // Queue email
  async queueEmail(emailData) {
    try {
      await this.queues.notifications.add('send_email', {
        type: 'send_email',
        data: emailData,
      });
    } catch (error) {
      console.error('Error queueing email:', error);
      throw error;
    }
  }

  // Queue SMS
  async queueSMS(smsData) {
    try {
      await this.queues.notifications.add('send_sms', {
        type: 'send_sms',
        data: smsData,
      });
    } catch (error) {
      console.error('Error queueing SMS:', error);
      throw error;
    }
  }

  // Get queue stats
  async getQueueStats() {
    try {
      const stats = {};
      
      for (const [name, queue] of Object.entries(this.queues)) {
        const waiting = await queue.getWaiting();
        const active = await queue.getActive();
        const completed = await queue.getCompleted();
        const failed = await queue.getFailed();

        stats[name] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
        };
      }

      return stats;
    } catch (error) {
      console.error('Error getting queue stats:', error);
      throw error;
    }
  }

  // Cleanup
  async cleanup() {
    try {
      // Close workers
      await Promise.all(
        Object.values(this.workers).map(worker => worker.close())
      );

      // Close queues
      await Promise.all(
        Object.values(this.queues).map(queue => queue.close())
      );

      console.log('Job service cleaned up');
    } catch (error) {
      console.error('Error cleaning up job service:', error);
    }
  }
}

module.exports = new JobService();
