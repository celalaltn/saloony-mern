const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const NotificationLog = require('../models/NotificationLog');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

class NotificationService {
  // Send email notification
  async sendEmail(options) {
    try {
      const {
        to,
        subject,
        content,
        companyId,
        purpose,
        recipientType = 'customer',
        recipientId,
        reference = {}
      } = options;

      const msg = {
        to,
        from: {
          email: process.env.FROM_EMAIL,
          name: process.env.FROM_NAME || 'Saloony'
        },
        subject,
        html: content,
      };

      // Create notification log
      const notificationLog = new NotificationLog({
        company: companyId,
        recipient: {
          [recipientType]: recipientId,
          email: to,
        },
        type: 'email',
        purpose,
        subject,
        content,
        reference,
        status: 'pending',
      });

      await notificationLog.save();

      // Send email
      const response = await sgMail.send(msg);

      // Update notification log
      notificationLog.status = 'sent';
      notificationLog.sentAt = new Date();
      notificationLog.metadata = {
        provider: 'sendgrid',
        messageId: response[0].headers['x-message-id'],
      };
      await notificationLog.save();

      return {
        success: true,
        messageId: response[0].headers['x-message-id'],
        logId: notificationLog._id,
      };
    } catch (error) {
      console.error('Email sending error:', error);
      
      // Update notification log with error
      if (notificationLog) {
        notificationLog.status = 'failed';
        notificationLog.failureReason = error.message;
        await notificationLog.save();
      }

      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Send SMS notification
  async sendSMS(options) {
    try {
      const {
        to,
        content,
        companyId,
        purpose,
        recipientType = 'customer',
        recipientId,
        reference = {}
      } = options;

      // Create notification log
      const notificationLog = new NotificationLog({
        company: companyId,
        recipient: {
          [recipientType]: recipientId,
          phone: to,
        },
        type: 'sms',
        purpose,
        content,
        reference,
        status: 'pending',
      });

      await notificationLog.save();

      // Send SMS
      const message = await twilioClient.messages.create({
        body: content,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });

      // Update notification log
      notificationLog.status = 'sent';
      notificationLog.sentAt = new Date();
      notificationLog.metadata = {
        provider: 'twilio',
        messageId: message.sid,
        cost: message.price ? parseFloat(message.price) : 0,
      };
      await notificationLog.save();

      return {
        success: true,
        messageId: message.sid,
        logId: notificationLog._id,
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      
      // Update notification log with error
      if (notificationLog) {
        notificationLog.status = 'failed';
        notificationLog.failureReason = error.message;
        await notificationLog.save();
      }

      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  // Send appointment reminder
  async sendAppointmentReminder(appointment) {
    try {
      const customer = appointment.customer;
      const staff = appointment.staff;
      const company = appointment.company;
      const appointmentDate = new Date(appointment.dateTime);
      
      const formattedDate = appointmentDate.toLocaleDateString('tr-TR');
      const formattedTime = appointmentDate.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const services = appointment.services.map(s => s.service.name).join(', ');

      // Email content
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Randevu Hatırlatması</h2>
          <p>Merhaba ${customer.firstName} ${customer.lastName},</p>
          <p>Yarın randevunuz bulunmaktadır:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tarih:</strong> ${formattedDate}</p>
            <p><strong>Saat:</strong> ${formattedTime}</p>
            <p><strong>Hizmetler:</strong> ${services}</p>
            <p><strong>Personel:</strong> ${staff.firstName} ${staff.lastName}</p>
            <p><strong>Salon:</strong> ${company.name}</p>
          </div>
          <p>Randevunuzu iptal etmeniz gerekiyorsa lütfen en az 24 saat öncesinden bizi arayın.</p>
          <p>Teşekkürler,<br>${company.name}</p>
        </div>
      `;

      // SMS content
      const smsContent = `Randevu hatırlatması: ${formattedDate} ${formattedTime} tarihinde ${company.name}'de randevunuz var. Hizmetler: ${services}. İptal için 24 saat öncesinden arayın.`;

      const promises = [];

      // Send email if customer has email and preferences allow
      if (customer.email && customer.preferences.communicationPreference !== 'sms') {
        promises.push(
          this.sendEmail({
            to: customer.email,
            subject: `Randevu Hatırlatması - ${company.name}`,
            content: emailContent,
            companyId: company._id,
            purpose: 'appointment_reminder',
            recipientType: 'customer',
            recipientId: customer._id,
            reference: { appointment: appointment._id },
          })
        );
      }

      // Send SMS if customer preferences allow
      if (customer.preferences.communicationPreference !== 'email') {
        promises.push(
          this.sendSMS({
            to: customer.phone,
            content: smsContent,
            companyId: company._id,
            purpose: 'appointment_reminder',
            recipientType: 'customer',
            recipientId: customer._id,
            reference: { appointment: appointment._id },
          })
        );
      }

      const results = await Promise.allSettled(promises);
      return results;
    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      throw error;
    }
  }

  // Send appointment confirmation
  async sendAppointmentConfirmation(appointment) {
    try {
      const customer = appointment.customer;
      const staff = appointment.staff;
      const company = appointment.company;
      const appointmentDate = new Date(appointment.dateTime);
      
      const formattedDate = appointmentDate.toLocaleDateString('tr-TR');
      const formattedTime = appointmentDate.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const services = appointment.services.map(s => s.service.name).join(', ');

      // Email content
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Randevu Onaylandı</h2>
          <p>Merhaba ${customer.firstName} ${customer.lastName},</p>
          <p>Randevunuz başarıyla oluşturuldu:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Tarih:</strong> ${formattedDate}</p>
            <p><strong>Saat:</strong> ${formattedTime}</p>
            <p><strong>Hizmetler:</strong> ${services}</p>
            <p><strong>Personel:</strong> ${staff.firstName} ${staff.lastName}</p>
            <p><strong>Toplam Tutar:</strong> ${appointment.totalAmount} ₺</p>
          </div>
          <p>Randevunuzu iptal etmeniz gerekiyorsa lütfen en az 24 saat öncesinden bizi arayın.</p>
          <p>Görüşmek üzere,<br>${company.name}</p>
        </div>
      `;

      // SMS content
      const smsContent = `Randevunuz onaylandı: ${formattedDate} ${formattedTime} - ${services}. Toplam: ${appointment.totalAmount}₺. ${company.name}`;

      const promises = [];

      // Send email if customer has email
      if (customer.email && customer.preferences.communicationPreference !== 'sms') {
        promises.push(
          this.sendEmail({
            to: customer.email,
            subject: `Randevu Onayı - ${company.name}`,
            content: emailContent,
            companyId: company._id,
            purpose: 'appointment_confirmation',
            recipientType: 'customer',
            recipientId: customer._id,
            reference: { appointment: appointment._id },
          })
        );
      }

      // Send SMS if customer preferences allow
      if (customer.preferences.communicationPreference !== 'email') {
        promises.push(
          this.sendSMS({
            to: customer.phone,
            content: smsContent,
            companyId: company._id,
            purpose: 'appointment_confirmation',
            recipientType: 'customer',
            recipientId: customer._id,
            reference: { appointment: appointment._id },
          })
        );
      }

      const results = await Promise.allSettled(promises);
      return results;
    } catch (error) {
      console.error('Error sending appointment confirmation:', error);
      throw error;
    }
  }

  // Send package expiry warning
  async sendPackageExpiryWarning(packageInstance) {
    try {
      const customer = packageInstance.customer;
      const company = packageInstance.company;
      const packageData = packageInstance.package;
      const expiryDate = new Date(packageInstance.expiryDate);
      
      const formattedDate = expiryDate.toLocaleDateString('tr-TR');

      // Email content
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Paket Süresi Dolmak Üzere</h2>
          <p>Merhaba ${customer.firstName} ${customer.lastName},</p>
          <p>Paketinizin süresi dolmak üzere:</p>
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Paket:</strong> ${packageData.name}</p>
            <p><strong>Kalan Seans:</strong> ${packageInstance.remainingSessions}</p>
            <p><strong>Son Kullanım Tarihi:</strong> ${formattedDate}</p>
          </div>
          <p>Paketinizi kullanmak için randevu almayı unutmayın!</p>
          <p>İyi günler,<br>${company.name}</p>
        </div>
      `;

      // SMS content
      const smsContent = `Paket uyarısı: ${packageData.name} paketinizin ${packageInstance.remainingSessions} seansı kaldı. Son kullanım: ${formattedDate}. Randevu için arayın. ${company.name}`;

      const promises = [];

      // Send email if customer has email
      if (customer.email && customer.preferences.communicationPreference !== 'sms') {
        promises.push(
          this.sendEmail({
            to: customer.email,
            subject: `Paket Süresi Dolmak Üzere - ${company.name}`,
            content: emailContent,
            companyId: company._id,
            purpose: 'package_expiry_warning',
            recipientType: 'customer',
            recipientId: customer._id,
            reference: { packageInstance: packageInstance._id },
          })
        );
      }

      // Send SMS if customer preferences allow
      if (customer.preferences.communicationPreference !== 'email') {
        promises.push(
          this.sendSMS({
            to: customer.phone,
            content: smsContent,
            companyId: company._id,
            purpose: 'package_expiry_warning',
            recipientType: 'customer',
            recipientId: customer._id,
            reference: { packageInstance: packageInstance._id },
          })
        );
      }

      const results = await Promise.allSettled(promises);
      return results;
    } catch (error) {
      console.error('Error sending package expiry warning:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
