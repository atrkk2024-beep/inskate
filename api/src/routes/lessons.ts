import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, optionalAuth, requireAdmin, requireSubscriber } from '../middleware/auth';
import { getPaginationParams, createPaginationMeta } from '../utils/pagination';

const listLessonsQuery = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED']).optional(),
  isFree: z.coerce.boolean().optional(),
});

const createLessonSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  durationSec: z.number().int().min(0).optional(),
  thumbnailUrl: z.string().url().optional(),
  videoUrl: z.string(),
  isFree: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED']).optional(),
  order: z.number().int().optional(),
});

const updateLessonSchema = createLessonSchema.partial();

const reorderSchema = z.object({
  lessons: z.array(z.object({
    id: z.string(),
    order: z.number().int(),
  })),
});

const recordViewSchema = z.object({
  watchTimeSec: z.number().int().min(0).optional(),
});

export async function lessonRoutes(app: FastifyInstance) {
  // List lessons (public - shows only published, or all for admin)
  app.get('/', { preHandler: optionalAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = listLessonsQuery.parse(request.query);
    const { page, limit, skip } = getPaginationParams(query);
    const isAdmin = request.userRole === 'ADMIN';

    const where: any = {};

    if (!isAdmin) {
      where.status = 'PUBLISHED';
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.isFree !== undefined) {
      where.isFree = query.isFree;
    }

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        orderBy: { order: 'asc' },
        include: {
          category: { select: { id: true, title: true } },
          _count: { select: { comments: { where: { status: 'ACTIVE' } } } },
        },
      }),
      prisma.lesson.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: lessons.map((l) => ({
        id: l.id,
        categoryId: l.categoryId,
        category: l.category,
        title: l.title,
        description: l.description,
        durationSec: l.durationSec,
        thumbnailUrl: l.thumbnailUrl,
        isFree: l.isFree,
        status: l.status,
        order: l.order,
        publishedAt: l.publishedAt,
        commentCount: l._count.comments,
      })),
      meta: createPaginationMeta(page, limit, total),
    });
  });

  // Get lesson by ID
  app.get('/:id', { preHandler: optionalAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const isAdmin = request.userRole === 'ADMIN';

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, title: true } },
      },
    });

    if (!lesson) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Lesson not found',
        },
      });
    }

    // Check access
    if (lesson.status !== 'PUBLISHED' && !isAdmin) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Lesson not found',
        },
      });
    }

    // Check if user has access to premium content
    let hasAccess = lesson.isFree;
    
    if (!hasAccess && request.userId) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: request.userId },
      });
      hasAccess = subscription?.status === 'TRIAL' || subscription?.status === 'ACTIVE';
    }

    return reply.send({
      success: true,
      data: {
        ...lesson,
        videoUrl: hasAccess || isAdmin ? lesson.videoUrl : null,
        hasAccess,
      },
    });
  });

  // Create lesson (admin only)
  app.post('/', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createLessonSchema.parse(request.body);

    // Get max order if not provided
    let order = body.order;
    if (order === undefined) {
      const maxOrder = await prisma.lesson.findFirst({
        where: { categoryId: body.categoryId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = (maxOrder?.order ?? -1) + 1;
    }

    const lesson = await prisma.lesson.create({
      data: {
        categoryId: body.categoryId,
        title: body.title,
        description: body.description,
        durationSec: body.durationSec || 0,
        thumbnailUrl: body.thumbnailUrl,
        videoUrl: body.videoUrl,
        isFree: body.isFree || false,
        status: body.status || 'DRAFT',
        order,
        publishedAt: body.status === 'PUBLISHED' ? new Date() : null,
      },
    });

    return reply.status(201).send({
      success: true,
      data: lesson,
    });
  });

  // Update lesson (admin only)
  app.patch('/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = updateLessonSchema.parse(request.body);

    const existingLesson = await prisma.lesson.findUnique({ where: { id } });
    if (!existingLesson) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lesson not found' },
      });
    }

    // Set publishedAt if status changes to PUBLISHED
    const updateData: any = { ...body };
    if (body.status === 'PUBLISHED' && existingLesson.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
    });

    return reply.send({
      success: true,
      data: lesson,
    });
  });

  // Delete lesson (admin only)
  app.delete('/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    await prisma.lesson.delete({
      where: { id },
    });

    return reply.send({
      success: true,
    });
  });

  // Reorder lessons (admin only)
  app.post('/reorder', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = reorderSchema.parse(request.body);

    await prisma.$transaction(
      body.lessons.map((l) =>
        prisma.lesson.update({
          where: { id: l.id },
          data: { order: l.order },
        })
      )
    );

    return reply.send({
      success: true,
    });
  });

  // Approve/reject lesson (moderation)
  app.post('/:id/moderate', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { action } = z.object({ action: z.enum(['approve', 'reject']) }).parse(request.body);

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'PUBLISHED' : 'DRAFT',
        publishedAt: action === 'approve' ? new Date() : null,
      },
    });

    return reply.send({
      success: true,
      data: lesson,
    });
  });

  // Record view
  app.post('/:id/view', { preHandler: optionalAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = recordViewSchema.parse(request.body);

    await prisma.lessonView.create({
      data: {
        lessonId: id,
        userId: request.userId || null,
        watchTimeSec: body.watchTimeSec || 0,
      },
    });

    return reply.send({
      success: true,
    });
  });
}

