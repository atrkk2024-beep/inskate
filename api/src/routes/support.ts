import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getPaginationParams, createPaginationMeta } from '../utils/pagination';

const createTicketSchema = z.object({
  lessonId: z.string().optional(),
  topic: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
});

const createContactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  message: z.string().min(1).max(2000),
  lessonId: z.string().optional(),
});

const listTicketsQuery = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
});

export async function supportRoutes(app: FastifyInstance) {
  // Create support ticket (authenticated users)
  app.post('/tickets', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createTicketSchema.parse(request.body);

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: request.userId!,
        lessonId: body.lessonId,
        topic: body.topic,
        message: body.message,
      },
    });

    return reply.status(201).send({
      success: true,
      data: ticket,
    });
  });

  // Contact form (public - creates ticket for guest)
  app.post('/contact', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createContactSchema.parse(request.body);

    // Find or create user by phone
    let user = await prisma.user.findUnique({
      where: { phone: body.phone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: body.phone,
          name: body.name,
          role: 'GUEST',
        },
      });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        lessonId: body.lessonId,
        topic: 'Обращение с сайта',
        message: `Имя: ${body.name}\nТелефон: ${body.phone}\n\n${body.message}`,
      },
    });

    return reply.status(201).send({
      success: true,
      data: { id: ticket.id },
    });
  });

  // Trial lesson request
  app.post('/trial-lesson', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = z.object({
      name: z.string().min(1).max(100),
      phone: z.string().min(10).max(20),
      message: z.string().optional(),
    }).parse(request.body);

    // Find or create user by phone
    let user = await prisma.user.findUnique({
      where: { phone: body.phone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: body.phone,
          name: body.name,
          role: 'GUEST',
        },
      });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id,
        topic: 'Запись на пробную тренировку',
        message: `Имя: ${body.name}\nТелефон: ${body.phone}\n\n${body.message || 'Хочу записаться на пробную тренировку'}`,
      },
    });

    return reply.status(201).send({
      success: true,
      data: { id: ticket.id },
    });
  });

  // Get user's tickets
  app.get('/tickets/me', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: request.userId },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({
      success: true,
      data: tickets,
    });
  });

  // List all tickets (admin)
  app.get('/tickets', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = listTicketsQuery.parse(request.query);
    const { page, limit, skip } = getPaginationParams(query);

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true } },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: tickets,
      meta: createPaginationMeta(page, limit, total),
    });
  });

  // Update ticket status (admin)
  app.patch('/tickets/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { status } = z.object({
      status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    }).parse(request.body);

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status },
    });

    return reply.send({
      success: true,
      data: ticket,
    });
  });
}

