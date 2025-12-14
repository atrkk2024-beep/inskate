import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';
import { config } from '../config';
import { createCheckoutSession, createCustomerPortalSession, cancelSubscription } from '../services/stripe';

const createSubscriptionSchema = z.object({
  planId: z.string(),
});

export async function subscriptionRoutes(app: FastifyInstance) {
  // Get current user's subscription
  app.get('/me', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: request.userId },
      include: { plan: true },
    });

    if (!subscription) {
      return reply.send({
        success: true,
        data: null,
      });
    }

    return reply.send({
      success: true,
      data: {
        id: subscription.id,
        status: subscription.status,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          price: subscription.plan.price,
          currency: subscription.plan.currency,
          interval: subscription.plan.interval,
        },
        trialEndAt: subscription.trialEndAt,
        currentPeriodEndAt: subscription.currentPeriodEndAt,
        canceledAt: subscription.canceledAt,
      },
    });
  });

  // Create checkout session for subscription
  app.post('/checkout', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createSubscriptionSchema.parse(request.body);

    const plan = await prisma.plan.findUnique({
      where: { id: body.planId },
    });

    if (!plan || !plan.active) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'PLAN_NOT_FOUND',
          message: 'Plan not found or inactive',
        },
      });
    }

    if (!plan.stripePriceId) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'STRIPE_NOT_CONFIGURED',
          message: 'Stripe is not configured for this plan',
        },
      });
    }

    // Check existing subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: request.userId },
    });

    if (existingSubscription?.status === 'ACTIVE' || existingSubscription?.status === 'TRIAL') {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'ALREADY_SUBSCRIBED',
          message: 'You already have an active subscription',
        },
      });
    }

    try {
      const session = await createCheckoutSession({
        customerId: existingSubscription?.stripeCustomerId || undefined,
        priceId: plan.stripePriceId,
        successUrl: `${config.apiUrl}/api/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${config.adminUrl}/subscription/canceled`,
        trialDays: plan.trialDays,
        metadata: {
          userId: request.userId!,
          planId: plan.id,
        },
      });

      return reply.send({
        success: true,
        data: {
          checkoutUrl: session.url,
          sessionId: session.id,
        },
      });
    } catch (error) {
      console.error('Stripe checkout error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'CHECKOUT_FAILED',
          message: 'Failed to create checkout session',
        },
      });
    }
  });

  // Handle successful checkout (redirect endpoint)
  app.get('/success', async (request: FastifyRequest, reply: FastifyReply) => {
    const { session_id } = request.query as { session_id: string };

    if (!session_id) {
      return reply.redirect(`${config.adminUrl}/subscription/error`);
    }

    // The actual subscription will be created via webhook
    // This is just a redirect endpoint
    return reply.redirect(`${config.adminUrl}/subscription/success`);
  });

  // Get customer portal session
  app.post('/portal', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: request.userId },
    });

    if (!subscription?.stripeCustomerId) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'No subscription found',
        },
      });
    }

    try {
      const session = await createCustomerPortalSession(
        subscription.stripeCustomerId,
        `${config.adminUrl}/profile`
      );

      return reply.send({
        success: true,
        data: {
          portalUrl: session.url,
        },
      });
    } catch (error) {
      console.error('Stripe portal error:', error);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'PORTAL_FAILED',
          message: 'Failed to create portal session',
        },
      });
    }
  });

  // Cancel subscription
  app.post('/cancel', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: request.userId },
    });

    if (!subscription) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NO_SUBSCRIPTION',
          message: 'No subscription found',
        },
      });
    }

    if (subscription.stripeSubscriptionId) {
      try {
        await cancelSubscription(subscription.stripeSubscriptionId);
      } catch (error) {
        console.error('Stripe cancel error:', error);
      }
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    // Update user role
    await prisma.user.update({
      where: { id: request.userId },
      data: { role: 'USER' },
    });

    return reply.send({
      success: true,
    });
  });

  // List all subscriptions (admin only)
  app.get('/', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = z.object({
      page: z.coerce.number().optional().default(1),
      limit: z.coerce.number().optional().default(20),
      status: z.enum(['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED']).optional(),
    }).parse(request.query);

    const skip = (query.page - 1) * query.limit;
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, phone: true, name: true } },
          plan: { select: { id: true, name: true, price: true, currency: true } },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: subscriptions,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  });

  // Manually grant subscription (admin only)
  app.post('/grant', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = z.object({
      userId: z.string(),
      planId: z.string(),
      durationDays: z.number().int().min(1).default(30),
    }).parse(request.body);

    const [user, plan] = await Promise.all([
      prisma.user.findUnique({ where: { id: body.userId } }),
      prisma.plan.findUnique({ where: { id: body.planId } }),
    ]);

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    if (!plan) {
      return reply.status(404).send({
        success: false,
        error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found' },
      });
    }

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + body.durationDays);

    const subscription = await prisma.subscription.upsert({
      where: { userId: body.userId },
      create: {
        userId: body.userId,
        planId: body.planId,
        status: 'ACTIVE',
        currentPeriodEndAt: periodEnd,
      },
      update: {
        planId: body.planId,
        status: 'ACTIVE',
        currentPeriodEndAt: periodEnd,
        canceledAt: null,
      },
    });

    // Update user role
    await prisma.user.update({
      where: { id: body.userId },
      data: { role: 'SUBSCRIBER' },
    });

    return reply.send({
      success: true,
      data: subscription,
    });
  });
}

