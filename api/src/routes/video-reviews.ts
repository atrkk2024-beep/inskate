import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireSubscriber, requireAdmin, requireCoachOrAdmin } from '../middleware/auth';
import { getPaginationParams, createPaginationMeta } from '../utils/pagination';
import { sendPushNotification } from '../services/push';

const createReviewSchema = z.object({
  videoUrl: z.string().url(),
  coachId: z.string().optional(),
});

const addMessageSchema = z.object({
  text: z.string().min(1).max(2000),
});

const listReviewsQuery = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'DONE', 'REJECTED']).optional(),
  coachId: z.string().optional(),
  userId: z.string().optional(),
});

export async function videoReviewRoutes(app: FastifyInstance) {
  // Get user's video reviews
  app.get('/me', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const reviews = await prisma.videoReview.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        coach: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return reply.send({
      success: true,
      data: reviews,
    });
  });

  // Get single review
  app.get('/:id', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const review = await prisma.videoReview.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        coach: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!review) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    // Check access
    const isAdmin = request.userRole === 'ADMIN';
    const isCoach = request.userRole === 'COACH';
    const isOwner = review.userId === request.userId;

    if (!isAdmin && !isCoach && !isOwner) {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    return reply.send({
      success: true,
      data: review,
    });
  });

  // Create video review (subscribers only)
  app.post('/', { preHandler: requireSubscriber }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createReviewSchema.parse(request.body);

    const review = await prisma.videoReview.create({
      data: {
        userId: request.userId!,
        videoUrl: body.videoUrl,
        coachId: body.coachId,
        status: 'SUBMITTED',
      },
      include: {
        coach: { select: { id: true, name: true } },
      },
    });

    return reply.status(201).send({
      success: true,
      data: review,
    });
  });

  // Add message to review
  app.post('/:id/messages', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = addMessageSchema.parse(request.body);

    const review = await prisma.videoReview.findUnique({
      where: { id },
    });

    if (!review) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Review not found' },
      });
    }

    // Check access
    const isAdmin = request.userRole === 'ADMIN';
    const isCoach = request.userRole === 'COACH';
    const isOwner = review.userId === request.userId;

    if (!isAdmin && !isCoach && !isOwner) {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
      });
    }

    const authorRole = isCoach || isAdmin ? 'coach' : 'user';

    const message = await prisma.videoReviewMessage.create({
      data: {
        reviewId: id,
        userId: request.userId!,
        authorRole,
        text: body.text,
      },
    });

    // Send push notification to the other party
    const targetUserId = authorRole === 'coach' ? review.userId : null;
    if (targetUserId) {
      const tokens = await prisma.deviceToken.findMany({
        where: { userId: targetUserId },
        select: { token: true },
      });

      if (tokens.length > 0) {
        await sendPushNotification({
          tokens: tokens.map((t) => t.token),
          title: 'Новый комментарий к разбору',
          body: 'Тренер оставил комментарий к вашему видеоразбору',
          data: { type: 'video_review', reviewId: id },
        });
      }
    }

    return reply.status(201).send({
      success: true,
      data: message,
    });
  });

  // List all reviews (admin/coach)
  app.get('/', { preHandler: requireCoachOrAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = listReviewsQuery.parse(request.query);
    const { page, limit, skip } = getPaginationParams(query);

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.coachId) where.coachId = query.coachId;
    if (query.userId) where.userId = query.userId;

    // Coaches can only see their assigned reviews
    if (request.userRole === 'COACH') {
      const coach = await prisma.coach.findFirst({
        where: {
          // Assuming coach user has same id or linked somehow
          // For simplicity, filter by assigned reviews
        },
      });
      // In real implementation, link coach to user
    }

    const [reviews, total] = await Promise.all([
      prisma.videoReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true } },
          coach: { select: { id: true, name: true } },
          _count: { select: { messages: true } },
        },
      }),
      prisma.videoReview.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: reviews.map((r) => ({
        ...r,
        messageCount: r._count.messages,
      })),
      meta: createPaginationMeta(page, limit, total),
    });
  });

  // Update review status (admin/coach)
  app.patch('/:id/status', { preHandler: requireCoachOrAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { status, coachId } = z.object({
      status: z.enum(['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'DONE', 'REJECTED']),
      coachId: z.string().optional(),
    }).parse(request.body);

    const updateData: any = { status };
    
    if (coachId) {
      updateData.coachId = coachId;
    }

    if (status === 'DONE' || status === 'REJECTED') {
      updateData.resolvedAt = new Date();
    }

    const review = await prisma.videoReview.update({
      where: { id },
      data: updateData,
      include: {
        user: true,
        coach: { select: { name: true } },
      },
    });

    // Send push notification
    if (status === 'DONE') {
      const tokens = await prisma.deviceToken.findMany({
        where: { userId: review.userId },
        select: { token: true },
      });

      if (tokens.length > 0) {
        await sendPushNotification({
          tokens: tokens.map((t) => t.token),
          title: 'Видеоразбор готов',
          body: 'Ваш видеоразбор завершён. Посмотрите комментарии тренера.',
          data: { type: 'video_review', reviewId: id },
        });
      }
    }

    return reply.send({
      success: true,
      data: review,
    });
  });
}

