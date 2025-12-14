import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';

const dateRangeQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function analyticsRoutes(app: FastifyInstance) {
  // Dashboard overview
  app.get('/dashboard', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = dateRangeQuery.parse(request.query);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = query.from ? new Date(query.from) : thirtyDaysAgo;
    const to = query.to ? new Date(query.to) : now;

    const [
      totalUsers,
      newUsers,
      activeSubscriptions,
      totalRevenue,
      totalBookings,
      pendingReviews,
      totalLessons,
      totalViews,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      prisma.subscription.count({
        where: { status: { in: ['TRIAL', 'ACTIVE'] } },
      }),
      prisma.subscription.aggregate({
        where: {
          status: 'ACTIVE',
          createdAt: { gte: from, lte: to },
        },
        _sum: { 
          // Note: In real implementation, track payments separately
        },
      }),
      prisma.booking.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      prisma.videoReview.count({
        where: { status: { in: ['SUBMITTED', 'IN_REVIEW'] } },
      }),
      prisma.lesson.count({
        where: { status: 'PUBLISHED' },
      }),
      prisma.lessonView.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        users: {
          total: totalUsers,
          new: newUsers,
        },
        subscriptions: {
          active: activeSubscriptions,
        },
        bookings: {
          total: totalBookings,
        },
        videoReviews: {
          pending: pendingReviews,
        },
        content: {
          lessons: totalLessons,
          views: totalViews,
        },
        period: { from, to },
      },
    });
  });

  // User statistics
  app.get('/users', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = dateRangeQuery.parse(request.query);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = query.from ? new Date(query.from) : thirtyDaysAgo;
    const to = query.to ? new Date(query.to) : now;

    // Users by country
    const usersByCountry = await prisma.user.groupBy({
      by: ['country'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    // Daily registrations
    const dailyRegistrations = await prisma.$queryRaw`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= ${from} AND created_at <= ${to}
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    return reply.send({
      success: true,
      data: {
        byCountry: usersByCountry.map((u) => ({
          country: u.country || 'Unknown',
          count: u._count.id,
        })),
        byRole: usersByRole.map((u) => ({
          role: u.role,
          count: u._count.id,
        })),
        dailyRegistrations,
      },
    });
  });

  // Content statistics
  app.get('/content', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = dateRangeQuery.parse(request.query);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = query.from ? new Date(query.from) : thirtyDaysAgo;
    const to = query.to ? new Date(query.to) : now;

    // Top lessons by views
    const topLessons = await prisma.lesson.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            views: {
              where: { createdAt: { gte: from, lte: to } },
            },
          },
        },
      },
      orderBy: {
        views: { _count: 'desc' },
      },
      take: 10,
    });

    // Views by category
    const viewsByCategory = await prisma.lessonCategory.findMany({
      select: {
        id: true,
        title: true,
        lessons: {
          select: {
            _count: {
              select: {
                views: {
                  where: { createdAt: { gte: from, lte: to } },
                },
              },
            },
          },
        },
      },
    });

    // Total watch time
    const watchTime = await prisma.lessonView.aggregate({
      where: { createdAt: { gte: from, lte: to } },
      _sum: { watchTimeSec: true },
      _avg: { watchTimeSec: true },
    });

    return reply.send({
      success: true,
      data: {
        topLessons: topLessons.map((l) => ({
          id: l.id,
          title: l.title,
          views: l._count.views,
        })),
        viewsByCategory: viewsByCategory.map((c) => ({
          id: c.id,
          title: c.title,
          views: c.lessons.reduce((acc, l) => acc + l._count.views, 0),
        })),
        watchTime: {
          totalSeconds: watchTime._sum.watchTimeSec || 0,
          averageSeconds: Math.round(watchTime._avg.watchTimeSec || 0),
        },
      },
    });
  });

  // Subscription statistics
  app.get('/subscriptions', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = dateRangeQuery.parse(request.query);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = query.from ? new Date(query.from) : thirtyDaysAgo;
    const to = query.to ? new Date(query.to) : now;

    // Subscriptions by status
    const byStatus = await prisma.subscription.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Subscriptions by plan
    const byPlan = await prisma.subscription.groupBy({
      by: ['planId'],
      _count: { id: true },
      where: { status: { in: ['TRIAL', 'ACTIVE'] } },
    });

    const plans = await prisma.plan.findMany({
      where: { id: { in: byPlan.map((b) => b.planId) } },
    });

    // New subscriptions in period
    const newSubscriptions = await prisma.subscription.count({
      where: { createdAt: { gte: from, lte: to } },
    });

    // Churned subscriptions
    const churnedSubscriptions = await prisma.subscription.count({
      where: {
        status: 'CANCELED',
        canceledAt: { gte: from, lte: to },
      },
    });

    return reply.send({
      success: true,
      data: {
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        byPlan: byPlan.map((b) => {
          const plan = plans.find((p) => p.id === b.planId);
          return {
            planId: b.planId,
            planName: plan?.name || 'Unknown',
            count: b._count.id,
          };
        }),
        newSubscriptions,
        churnedSubscriptions,
      },
    });
  });

  // Booking statistics
  app.get('/bookings', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = dateRangeQuery.parse(request.query);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = query.from ? new Date(query.from) : thirtyDaysAgo;
    const to = query.to ? new Date(query.to) : now;

    // Bookings by status
    const byStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { createdAt: { gte: from, lte: to } },
    });

    // Bookings by coach
    const byCoach = await prisma.booking.groupBy({
      by: ['coachId'],
      _count: { id: true },
      where: {
        createdAt: { gte: from, lte: to },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
    });

    const coaches = await prisma.coach.findMany({
      where: { id: { in: byCoach.map((b) => b.coachId) } },
    });

    return reply.send({
      success: true,
      data: {
        byStatus: byStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        byCoach: byCoach.map((b) => {
          const coach = coaches.find((c) => c.id === b.coachId);
          return {
            coachId: b.coachId,
            coachName: coach?.name || 'Unknown',
            count: b._count.id,
          };
        }),
      },
    });
  });
}

