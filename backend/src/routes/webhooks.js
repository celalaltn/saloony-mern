const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paymentService = require('../services/paymentService');

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await paymentService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Twilio webhook endpoint for SMS status updates
router.post('/twilio/sms-status', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { MessageSid, MessageStatus, ErrorCode } = req.body;
    
    // Update notification log with delivery status
    const NotificationLog = require('../models/NotificationLog');
    
    const notification = await NotificationLog.findOne({
      'metadata.messageId': MessageSid,
    });

    if (notification) {
      switch (MessageStatus) {
        case 'delivered':
          notification.status = 'delivered';
          notification.deliveredAt = new Date();
          break;
        case 'failed':
        case 'undelivered':
          notification.status = 'failed';
          notification.failureReason = ErrorCode ? `Error code: ${ErrorCode}` : 'Delivery failed';
          break;
      }
      
      await notification.save();
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling Twilio webhook:', error);
    res.status(500).send('Error');
  }
});

// SendGrid webhook endpoint for email events
router.post('/sendgrid/events', express.json(), async (req, res) => {
  try {
    const events = req.body;
    const NotificationLog = require('../models/NotificationLog');

    for (const event of events) {
      const { sg_message_id, event: eventType, reason } = event;
      
      if (!sg_message_id) continue;

      const notification = await NotificationLog.findOne({
        'metadata.messageId': sg_message_id,
      });

      if (notification) {
        switch (eventType) {
          case 'delivered':
            notification.status = 'delivered';
            notification.deliveredAt = new Date();
            break;
          case 'bounce':
          case 'dropped':
            notification.status = 'failed';
            notification.failureReason = reason || 'Email bounced or dropped';
            break;
        }
        
        await notification.save();
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling SendGrid webhook:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
