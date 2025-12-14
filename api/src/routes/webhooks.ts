import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { constructWebhookEvent } from '../services/stripe';
import Stripe from 'stripe';

export async function webhookRoutes(app: FastifyInstance) {
  // Stripe webhooks
  app.post('/stripe', {
    config: {
      rawBody: true,
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const signature = request.headers['stripe-signature'] as string;
    
    if (!signature) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_SIGNATURE', message: 'Missing Stripe signature' },
      });
    }

    let event: Stripe.Event;
    
    try {
      const rawBody = (request as any).rawBody || JSON.stringify(request.body);
      event = await constructWebhookEvent(rawBody, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' },
      });
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(session);
          break;
        }

        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          await handlePaymentFailed(invoice);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      console.error('Webhook handler error:', err);
      return reply.status(500).send({
        success: false,
        error: { code: 'HANDLER_ERROR', message: 'Webhook handler failed' },
      });
    }

    return reply.send({ received: true });
  });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  
  if (!userId || !planId) {
    console.error('Missing userId or planId in checkout session metadata');
    return;
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) {
    console.error('Plan not found:', planId);
    return;
  }

  // Create or update subscription
  const trialEnd = plan.trialDays > 0
    ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000)
    : null;

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      planId,
      status: trialEnd ? 'TRIAL' : 'ACTIVE',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      trialEndAt: trialEnd,
      currentPeriodEndAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    update: {
      planId,
      status: trialEnd ? 'TRIAL' : 'ACTIVE',
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      trialEndAt: trialEnd,
      canceledAt: null,
    },
  });

  // Update user role
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'SUBSCRIBER' },
  });
}

async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) {
    console.error('Subscription not found:', stripeSubscription.id);
    return;
  }

  let status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  
  switch (stripeSubscription.status) {
    case 'trialing':
      status = 'TRIAL';
      break;
    case 'active':
      status = 'ACTIVE';
      break;
    case 'past_due':
      status = 'PAST_DUE';
      break;
    case 'canceled':
    case 'unpaid':
      status = 'CANCELED';
      break;
    default:
      status = 'EXPIRED';
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status,
      currentPeriodEndAt: new Date(stripeSubscription.current_period_end * 1000),
      trialEndAt: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    },
  });

  // Update user role based on status
  const newRole = status === 'TRIAL' || status === 'ACTIVE' ? 'SUBSCRIBER' : 'USER';
  await prisma.user.update({
    where: { id: subscription.userId },
    data: { role: newRole },
  });
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSubscription.id },
  });

  if (!subscription) {
    return;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: subscription.userId },
    data: { role: 'USER' },
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'PAST_DUE' },
  });
}

