import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth';
import { getPaginationParams, createPaginationMeta } from '../utils/pagination';

const listCommentsQuery = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  lessonId: z.string().optional(),
  status: z.enum(['ACTIVE', 'HIDDEN']).optional(),
});

const createCommentSchema = z.object({
  lessonId: z.string(),
  text: z.string().min(1).max(1000),
});

export async function commentRoutes(app: FastifyInstance) {
  // List comments (with optional lessonId filter)
  app.get('/', { preHandler: optionalAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = listCommentsQuery.parse(request.query);
    const { page, limit, skip } = getPaginationParams(query);
    const isAdmin = request.userRole === 'ADMIN';

    const where: any = {};

    if (!isAdmin) {
      where.status = 'ACTIVE';
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.lessonId) {
      where.lessonId = query.lessonId;
    }

    const [comments, total] = await Promise.all([
      prisma.lessonComment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true } },
          lesson: { select: { id: true, title: true } },
        },
      }),
      prisma.lessonComment.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: comments.map((c) => ({
        id: c.id,
        lessonId: c.lessonId,
        lesson: c.lesson,
        text: c.text,
        status: c.status,
        createdAt: c.createdAt,
        user: {
          id: c.user.id,
          name: c.user.name || c.user.phone.slice(-4),
        },
      })),
      meta: createPaginationMeta(page, limit, total),
    });
  });

  // Get comments for a lesson
  app.get('/lesson/:lessonId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { lessonId } = request.params as { lessonId: string };
    const query = z.object({
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
    }).parse(request.query);
    
    const { page, limit, skip } = getPaginationParams(query);

    const [comments, total] = await Promise.all([
      prisma.lessonComment.findMany({
        where: {
          lessonId,
          status: 'ACTIVE',
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      }),
      prisma.lessonComment.count({
        where: { lessonId, status: 'ACTIVE' },
      }),
    ]);

    return reply.send({
      success: true,
      data: comments.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt,
        user: {
          id: c.user.id,
          name: c.user.name || c.user.phone.slice(-4),
        },
      })),
      meta: createPaginationMeta(page, limit, total),
    });
  });

  // Create comment
  app.post('/', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createCommentSchema.parse(request.body);

    // Check if lesson exists and is published
    const lesson = await prisma.lesson.findUnique({
      where: { id: body.lessonId },
    });

    if (!lesson || lesson.status !== 'PUBLISHED') {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Lesson not found',
        },
      });
    }

    const comment = await prisma.lessonComment.create({
      data: {
        lessonId: body.lessonId,
        userId: request.userId!,
        text: body.text,
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
      },
    });

    return reply.status(201).send({
      success: true,
      data: {
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
        user: {
          id: comment.user.id,
          name: comment.user.name || comment.user.phone.slice(-4),
        },
      },
    });
  });

  // Delete own comment
  app.delete('/:id', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const isAdmin = request.userRole === 'ADMIN';

    const comment = await prisma.lessonComment.findUnique({
      where: { id },
    });

    if (!comment) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Comment not found',
        },
      });
    }

    // Only allow deleting own comments or admin
    if (comment.userId !== request.userId && !isAdmin) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot delete this comment',
        },
      });
    }

    await prisma.lessonComment.delete({
      where: { id },
    });

    return reply.send({
      success: true,
    });
  });

  // Moderate comment (admin only)
  app.post('/:id/moderate', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { action } = z.object({ action: z.enum(['hide', 'show', 'delete']) }).parse(request.body);

    if (action === 'delete') {
      await prisma.lessonComment.delete({
        where: { id },
      });
    } else {
      await prisma.lessonComment.update({
        where: { id },
        data: {
          status: action === 'hide' ? 'HIDDEN' : 'ACTIVE',
        },
      });
    }

    return reply.send({
      success: true,
    });
  });
}

