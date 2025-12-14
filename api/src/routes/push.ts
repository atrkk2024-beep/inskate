import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import { sendPushToSegment } from '../services/push';
import { getPaginationParams, createPaginationMeta } from '../utils/pagination';

const createPushSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  segment: z.enum(['all', 'subscribers', 'non_subscribers']).default('all'),
  scheduledAt: z.string().datetime().optional(),
  data: z.record(z.string()).optional(),
});

export async function pushRoutes(app: FastifyInstance) {
  // Send push notification (admin)
  app.post('/send', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createPushSchema.parse(request.body);

    // If scheduled, save for later
    if (body.scheduledAt) {
      const scheduledDate = new Date(body.scheduledAt);
      
      if (scheduledDate <= new Date()) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_SCHEDULE',
            message: 'Scheduled time must be in the future',
          },
        });
      }

      const notification = await prisma.pushNotification.create({
        data: {
          title: body.title,
          body: body.body,
          segment: body.segment,
          data: body.data,
          scheduledAt: scheduledDate,
        },
      });

      return reply.send({
        success: true,
        data: {
          id: notification.id,
          scheduled: true,
          scheduledAt: notification.scheduledAt,
        },
      });
    }

    // Send immediately
    const result = await sendPushToSegment({
      segment: body.segment as any,
      title: body.title,
      body: body.body,
      data: body.data,
    });

    // Log the notification
    await prisma.pushNotification.create({
      data: {
        title: body.title,
        body: body.body,
        segment: body.segment,
        data: body.data,
        sentAt: new Date(),
      },
    });

    return reply.send({
      success: true,
      data: {
        sent: true,
        ...result,
      },
    });
  });

  // List push notifications (admin)
  app.get('/', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = z.object({
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
      pending: z.coerce.boolean().optional(),
    }).parse(request.query);

    const { page, limit, skip } = getPaginationParams(query);

    const where: any = {};
    if (query.pending) {
      where.sentAt = null;
      where.scheduledAt = { not: null };
    }

    const [notifications, total] = await Promise.all([
      prisma.pushNotification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pushNotification.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: notifications,
      meta: createPaginationMeta(page, limit, total),
    });
  });

  // Cancel scheduled notification (admin)
  app.delete('/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const notification = await prisma.pushNotification.findUnique({
      where: { id },
    });

    if (!notification) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notification not found' },
      });
    }

    if (notification.sentAt) {
      return reply.status(400).send({
        success: false,
        error: { code: 'ALREADY_SENT', message: 'Notification already sent' },
      });
    }

    await prisma.pushNotification.delete({
      where: { id },
    });

    return reply.send({
      success: true,
    });
  });
}

