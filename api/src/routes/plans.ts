import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import { stripe, createProduct, createPrice } from '../services/stripe';

const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().int().min(0), // in cents
  currency: z.string().length(3).default('USD'),
  interval: z.enum(['month', 'year']).default('month'),
  trialDays: z.number().int().min(0).default(0),
  features: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  order: z.number().int().optional(),
});

const updatePlanSchema = createPlanSchema.partial();

export async function planRoutes(app: FastifyInstance) {
  // List plans (public - only active)
  app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    return reply.send({
      success: true,
      data: plans.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency,
        interval: p.interval,
        trialDays: p.trialDays,
        features: p.features,
      })),
    });
  });

  // List all plans (admin)
  app.get('/all', { preHandler: requireAdmin }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const plans = await prisma.plan.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    return reply.send({
      success: true,
      data: plans.map((p) => ({
        ...p,
        subscriptionCount: p._count.subscriptions,
      })),
    });
  });

  // Get plan by ID
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const plan = await prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Plan not found',
        },
      });
    }

    return reply.send({
      success: true,
      data: plan,
    });
  });

  // Create plan (admin only)
  app.post('/', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createPlanSchema.parse(request.body);

    // Get max order if not provided
    let order = body.order;
    if (order === undefined) {
      const maxOrder = await prisma.plan.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = (maxOrder?.order ?? -1) + 1;
    }

    // Create Stripe product and price
    let stripeProductId: string | null = null;
    let stripePriceId: string | null = null;

    try {
      const product = await createProduct(body.name, { source: 'inskate' });
      stripeProductId = product.id;

      const price = await createPrice({
        productId: product.id,
        unitAmount: body.price,
        currency: body.currency.toLowerCase(),
        interval: body.interval,
      });
      stripePriceId = price.id;
    } catch (error) {
      console.error('Stripe error:', error);
      // Continue without Stripe integration in development
    }

    const plan = await prisma.plan.create({
      data: {
        name: body.name,
        price: body.price,
        currency: body.currency,
        interval: body.interval,
        trialDays: body.trialDays,
        features: body.features,
        active: body.active,
        order,
        stripeProductId,
        stripePriceId,
      },
    });

    return reply.status(201).send({
      success: true,
      data: plan,
    });
  });

  // Update plan (admin only)
  app.patch('/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = updatePlanSchema.parse(request.body);

    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (!existingPlan) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Plan not found' },
      });
    }

    // Update Stripe product name if changed
    if (body.name && existingPlan.stripeProductId) {
      try {
        await stripe.products.update(existingPlan.stripeProductId, {
          name: body.name,
        });
      } catch (error) {
        console.error('Stripe update error:', error);
      }
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: body,
    });

    return reply.send({
      success: true,
      data: plan,
    });
  });

  // Delete plan (admin only)
  app.delete('/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    // Check if plan has active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        planId: id,
        status: { in: ['TRIAL', 'ACTIVE'] },
      },
    });

    if (activeSubscriptions > 0) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'PLAN_HAS_SUBSCRIPTIONS',
          message: 'Cannot delete plan with active subscriptions',
        },
      });
    }

    const plan = await prisma.plan.findUnique({ where: { id } });
    
    // Archive in Stripe
    if (plan?.stripeProductId) {
      try {
        await stripe.products.update(plan.stripeProductId, { active: false });
      } catch (error) {
        console.error('Stripe archive error:', error);
      }
    }

    await prisma.plan.delete({
      where: { id },
    });

    return reply.send({
      success: true,
    });
  });
}

