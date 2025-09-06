import Stripe from 'stripe';
import { supabase } from '../supabase';
import { logger } from '../utils/logger';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
  maxAIInteractions: number;
  maxAssessments: number;
  maxLearningModules: number;
  priority: number; // 1 = basic, 2 = pro, 3 = premium
}

export interface PaymentSession {
  sessionId: string;
  customerId: string;
  subscriptionId?: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
}

export interface BillingInfo {
  customerId: string;
  subscriptionId?: string;
  currentPlan: SubscriptionPlan;
  nextBillingDate?: Date;
  paymentMethod?: Stripe.PaymentMethod;
  invoices: Stripe.Invoice[];
  usage: {
    aiInteractions: number;
    assessments: number;
    learningModules: number;
    period: string;
  };
}

class StripeService {
  private readonly webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  // Subscription Plans Configuration
  private readonly plans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 9.99,
      currency: 'usd',
      interval: 'month',
      stripePriceId: process.env.STRIPE_BASIC_PRICE_ID!,
      features: [
        'Basic AI coaching',
        '5 assessments/month',
        '10 learning modules',
        'Email support'
      ],
      maxAIInteractions: 100,
      maxAssessments: 5,
      maxLearningModules: 10,
      priority: 1
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 19.99,
      currency: 'usd',
      interval: 'month',
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
      features: [
        'Advanced AI coaching',
        'Unlimited assessments',
        '50 learning modules',
        'Priority support',
        'Custom insights',
        'Progress analytics'
      ],
      maxAIInteractions: 500,
      maxAssessments: -1, // unlimited
      maxLearningModules: 50,
      priority: 2
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 39.99,
      currency: 'usd',
      interval: 'month',
      stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
      features: [
        'Expert AI coaching',
        'Unlimited everything',
        'White-glove onboarding',
        '24/7 priority support',
        'Custom AI training',
        'Advanced analytics',
        'Professional consultation'
      ],
      maxAIInteractions: -1, // unlimited
      maxAssessments: -1, // unlimited
      maxLearningModules: -1, // unlimited
      priority: 3
    }
  ];

  // Get available subscription plans
  getPlans(): SubscriptionPlan[] {
    return this.plans;
  }

  // Get plan by ID
  getPlanById(planId: string): SubscriptionPlan | null {
    return this.plans.find(plan => plan.id === planId) || null;
  }

  // Create Stripe customer
  async createCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { userId }
      });

      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);

      logger.info('Created Stripe customer', { customerId: customer.id, userId });
      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', { error, userId, email });
      throw error;
    }
  }

  // Create checkout session for subscription
  async createCheckoutSession(
    userId: string, 
    planId: string, 
    successUrl: string, 
    cancelUrl: string
  ): Promise<PaymentSession> {
    try {
      const plan = this.getPlanById(planId);
      if (!plan) {
        throw new Error(`Invalid plan ID: ${planId}`);
      }

      // Get or create customer
      let customerId = await this.getCustomerId(userId);
      if (!customerId) {
        const { data: user } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        if (!user) throw new Error('User not found');
        
        const customer = await this.createCustomer(userId, user.email, user.full_name);
        customerId = customer.id;
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          planId
        },
        subscription_data: {
          metadata: {
            userId,
            planId
          }
        }
      });

      return {
        sessionId: session.id,
        customerId,
        status: 'pending'
      };
    } catch (error) {
      logger.error('Failed to create checkout session', { error, userId, planId });
      throw error;
    }
  }

  // Handle successful subscription
  async handleSubscriptionSuccess(subscriptionId: string): Promise<void> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata.userId;
      const planId = subscription.metadata.planId;

      if (!userId || !planId) {
        throw new Error('Missing metadata in subscription');
      }

      const plan = this.getPlanById(planId);
      if (!plan) {
        throw new Error(`Invalid plan ID: ${planId}`);
      }

      // Update user subscription in database
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: subscription.customer as string,
          plan_id: planId,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date()
        });

      if (error) throw error;

      // Reset usage counters for new billing period
      await this.resetUsageCounters(userId);

      logger.info('Subscription activated successfully', { userId, subscriptionId, planId });
    } catch (error) {
      logger.error('Failed to handle subscription success', { error, subscriptionId });
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string, immediately = false): Promise<void> {
    try {
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', userId)
        .single();

      if (!subscription?.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      if (immediately) {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      } else {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true
        });
      }

      // Update database
      await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: !immediately,
          status: immediately ? 'canceled' : 'active',
          updated_at: new Date()
        })
        .eq('user_id', userId);

      logger.info('Subscription canceled', { userId, immediately });
    } catch (error) {
      logger.error('Failed to cancel subscription', { error, userId });
      throw error;
    }
  }

  // Get billing information
  async getBillingInfo(userId: string): Promise<BillingInfo | null> {
    try {
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!subscription) return null;

      const plan = this.getPlanById(subscription.plan_id);
      if (!plan) return null;

      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      );

      // Get payment method
      let paymentMethod: Stripe.PaymentMethod | undefined;
      if (stripeSubscription.default_payment_method) {
        paymentMethod = await stripe.paymentMethods.retrieve(
          stripeSubscription.default_payment_method as string
        );
      }

      // Get recent invoices
      const invoices = await stripe.invoices.list({
        customer: subscription.stripe_customer_id,
        limit: 10
      });

      // Get usage data
      const usage = await this.getUsageData(userId);

      return {
        customerId: subscription.stripe_customer_id,
        subscriptionId: subscription.stripe_subscription_id,
        currentPlan: plan,
        nextBillingDate: new Date(stripeSubscription.current_period_end * 1000),
        paymentMethod,
        invoices: invoices.data,
        usage
      };
    } catch (error) {
      logger.error('Failed to get billing info', { error, userId });
      return null;
    }
  }

  // Feature gating - check if user can access feature
  async canAccessFeature(userId: string, feature: string): Promise<boolean> {
    try {
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_id, status')
        .eq('user_id', userId)
        .single();

      if (!subscription || subscription.status !== 'active') {
        return false; // No active subscription
      }

      const plan = this.getPlanById(subscription.plan_id);
      if (!plan) return false;

      return plan.features.includes(feature);
    } catch (error) {
      logger.error('Failed to check feature access', { error, userId, feature });
      return false;
    }
  }

  // Check usage limits
  async checkUsageLimit(userId: string, type: 'aiInteractions' | 'assessments' | 'learningModules'): Promise<boolean> {
    try {
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_id, status')
        .eq('user_id', userId)
        .single();

      if (!subscription || subscription.status !== 'active') {
        return false;
      }

      const plan = this.getPlanById(subscription.plan_id);
      if (!plan) return false;

      const limit = plan[`max${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof SubscriptionPlan] as number;
      if (limit === -1) return true; // Unlimited

      const usage = await this.getUsageData(userId);
      const currentUsage = usage[type];

      return currentUsage < limit;
    } catch (error) {
      logger.error('Failed to check usage limit', { error, userId, type });
      return false;
    }
  }

  // Increment usage counter
  async incrementUsage(userId: string, type: 'aiInteractions' | 'assessments' | 'learningModules'): Promise<void> {
    try {
      const column = `${type.replace(/([A-Z])/g, '_$1').toLowerCase()}`;
      
      await supabase.rpc('increment_usage_counter', {
        p_user_id: userId,
        p_counter_type: column
      });
    } catch (error) {
      logger.error('Failed to increment usage', { error, userId, type });
    }
  }

  // Handle Stripe webhook
  async handleWebhook(body: string, signature: string): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(body, signature, this.webhookSecret);

      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.mode === 'subscription' && session.subscription) {
            await this.handleSubscriptionSuccess(session.subscription as string);
          }
          break;

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          await this.updateSubscriptionStatus(subscription);
          break;

        case 'invoice.payment_succeeded':
          const invoice = event.data.object as Stripe.Invoice;
          await this.handlePaymentSuccess(invoice);
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as Stripe.Invoice;
          await this.handlePaymentFailure(failedInvoice);
          break;

        default:
          logger.info('Unhandled webhook event', { type: event.type });
      }
    } catch (error) {
      logger.error('Webhook handling failed', { error });
      throw error;
    }
  }

  // Private helper methods
  private async getCustomerId(userId: string): Promise<string | null> {
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    return user?.stripe_customer_id || null;
  }

  private async getUsageData(userId: string) {
    const { data: usage } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .single();

    return usage || {
      aiInteractions: 0,
      assessments: 0,
      learningModules: 0,
      period: new Date().toISOString().slice(0, 7) // YYYY-MM format
    };
  }

  private async resetUsageCounters(userId: string): Promise<void> {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    
    await supabase
      .from('user_usage')
      .upsert({
        user_id: userId,
        ai_interactions: 0,
        assessments: 0,
        learning_modules: 0,
        period: currentPeriod,
        updated_at: new Date()
      });
  }

  private async updateSubscriptionStatus(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId;
    if (!userId) return;

    await supabase
      .from('user_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date()
      })
      .eq('stripe_subscription_id', subscription.id);

    logger.info('Subscription status updated', { subscriptionId: subscription.id, status: subscription.status });
  }

  private async handlePaymentSuccess(invoice: Stripe.Invoice): Promise<void> {
    logger.info('Payment succeeded', { invoiceId: invoice.id, customerId: invoice.customer });
    
    // Record revenue analytics
    await supabase
      .from('revenue_analytics')
      .insert({
        stripe_invoice_id: invoice.id,
        customer_id: invoice.customer as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'paid',
        payment_date: new Date(invoice.status_transitions.paid_at! * 1000)
      });
  }

  private async handlePaymentFailure(invoice: Stripe.Invoice): Promise<void> {
    logger.error('Payment failed', { invoiceId: invoice.id, customerId: invoice.customer });
    
    // Notify user about failed payment
    // Implementation would depend on notification service
  }
}

export const stripeService = new StripeService();
