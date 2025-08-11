const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Company = require('../models/Company');

class PaymentService {
  // Create Stripe customer
  async createCustomer(companyData) {
    try {
      const customer = await stripe.customers.create({
        email: companyData.email,
        name: companyData.name,
        phone: companyData.phone,
        metadata: {
          companyId: companyData._id.toString(),
          businessType: companyData.businessType,
        },
      });

      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create payment customer');
    }
  }

  // Create subscription for company
  async createSubscription(companyId, priceId = 'price_basic_monthly') {
    try {
      const company = await Company.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Create Stripe customer if not exists
      let stripeCustomerId = company.subscription.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.createCustomer(company);
        stripeCustomerId = customer.id;
        
        // Update company with Stripe customer ID
        company.subscription.stripeCustomerId = stripeCustomerId;
        await company.save();
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          companyId: companyId.toString(),
        },
      });

      // Update company subscription info
      company.subscription.stripeSubscriptionId = subscription.id;
      company.subscription.status = subscription.status === 'active' ? 'active' : 'inactive';
      company.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      company.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      company.subscription.plan = 'basic';
      await company.save();

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Failed to create subscription');
    }
  }

  // Handle webhook events
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  async handleSubscriptionCreated(subscription) {
    const companyId = subscription.metadata.companyId;
    if (!companyId) return;

    const company = await Company.findById(companyId);
    if (!company) return;

    company.subscription.status = 'active';
    company.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    company.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    await company.save();
  }

  async handleSubscriptionUpdated(subscription) {
    const companyId = subscription.metadata.companyId;
    if (!companyId) return;

    const company = await Company.findById(companyId);
    if (!company) return;

    company.subscription.status = subscription.status === 'active' ? 'active' : 'inactive';
    company.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
    company.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    await company.save();
  }

  async handleSubscriptionDeleted(subscription) {
    const companyId = subscription.metadata.companyId;
    if (!companyId) return;

    const company = await Company.findById(companyId);
    if (!company) return;

    company.subscription.status = 'cancelled';
    await company.save();
  }

  async handlePaymentSucceeded(invoice) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const companyId = subscription.metadata.companyId;
    
    if (!companyId) return;

    const company = await Company.findById(companyId);
    if (!company) return;

    company.subscription.status = 'active';
    await company.save();

    // Here you could also create a transaction record for the payment
    // and send a payment confirmation email
  }

  async handlePaymentFailed(invoice) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const companyId = subscription.metadata.companyId;
    
    if (!companyId) return;

    const company = await Company.findById(companyId);
    if (!company) return;

    company.subscription.status = 'past_due';
    await company.save();

    // Here you could send a payment failed notification
  }

  // Cancel subscription
  async cancelSubscription(companyId) {
    try {
      const company = await Company.findById(companyId);
      if (!company || !company.subscription.stripeSubscriptionId) {
        throw new Error('Subscription not found');
      }

      const subscription = await stripe.subscriptions.update(
        company.subscription.stripeSubscriptionId,
        { cancel_at_period_end: true }
      );

      company.subscription.status = 'cancelled';
      await company.save();

      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  // Create payment intent for one-time payments
  async createPaymentIntent(amount, currency = 'try', metadata = {}) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
      });

      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }
}

module.exports = new PaymentService();
