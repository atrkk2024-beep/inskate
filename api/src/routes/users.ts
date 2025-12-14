import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import { getPaginationParams, createPaginationMeta } from '../utils/pagination';

const listUsersQuery = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  role: z.string().optional(),
  hasSubscription: z.coerce.boolean().optional(),
});

export async function userRoutes(app: FastifyInstance) {
  // List users (admin only)
  app.get('/', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = listUsersQuery.parse(request.query);
    const { page, limit, skip } = getPaginationParams(query);

    const where: any = {};

    if (query.search) {
      where.OR = [
        { phone: { contains: query.search } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.hasSubscription !== undefined) {
      if (query.hasSubscription) {
        where.subscription = {
          status: { in: ['TRIAL', 'ACTIVE'] },
        };
      } else {
        where.OR = [
          { subscription: null },
          { subscription: { status: { notIn: ['TRIAL', 'ACTIVE'] } } },
        ];
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        phone: u.phone,
        name: u.name,
        role: u.role,
        country: u.country,
        createdAt: u.createdAt,
        subscription: u.subscription
          ? {
              status: u.subscription.status,
              plan: u.subscription.plan.name,
              currentPeriodEndAt: u.subscription.currentPeriodEndAt,
            }
          : null,
      })),
      meta: createPaginationMeta(page, limit, total),
    });
  });

  // Get user by ID (admin only)
  app.get('/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        subscription: { include: { plan: true } },
        bookings: {
          include: { coach: true, slot: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        videoReviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    return reply.send({
      success: true,
      data: user,
    });
  });

  // Update user role (admin only)
  app.patch('/:id/role', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { role } = z.object({ role: z.enum(['USER', 'SUBSCRIBER', 'COACH', 'MANAGER', 'ADMIN']) }).parse(request.body);

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return reply.send({
      success: true,
      data: {
        id: user.id,
        role: user.role,
      },
    });
  });

  // Export users to CSV (admin only)
  app.get('/export/csv', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const users = await prisma.user.findMany({
      include: {
        subscription: { include: { plan: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const csvHeader = 'ID,Phone,Name,Role,Country,Subscription,SubscriptionStatus,CreatedAt\n';
    const csvRows = users.map((u) => {
      return [
        u.id,
        u.phone,
        u.name || '',
        u.role,
        u.country || '',
        u.subscription?.plan.name || '',
        u.subscription?.status || '',
        u.createdAt.toISOString(),
      ].join(',');
    });

    const csv = csvHeader + csvRows.join('\n');

    return reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`)
      .send(csv);
  });
}

