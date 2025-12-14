import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getPaginationParams, createPaginationMeta } from '../utils/pagination';

const createCoachSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  socials: z.record(z.string()).default({}),
  active: z.boolean().default(true),
});

const updateCoachSchema = createCoachSchema.partial();

const createSlotSchema = z.object({
  coachId: z.string(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

const createSlotsSchema = z.object({
  coachId: z.string(),
  slots: z.array(z.object({
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
  })),
});

export async function coachRoutes(app: FastifyInstance) {
  // List coaches (public - only active)
  app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const coaches = await prisma.coach.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return reply.send({
      success: true,
      data: coaches.map((c) => ({
        id: c.id,
        name: c.name,
        level: c.level,
        bio: c.bio,
        avatarUrl: c.avatarUrl,
        socials: c.socials,
      })),
    });
  });

  // List all coaches (admin)
  app.get('/all', { preHandler: requireAdmin }, async (_request: FastifyRequest, reply: FastifyReply) => {
    const coaches = await prisma.coach.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            bookings: { where: { status: { in: ['PENDING', 'CONFIRMED'] } } },
            videoReviews: { where: { status: { in: ['SUBMITTED', 'IN_REVIEW'] } } },
          },
        },
      },
    });

    return reply.send({
      success: true,
      data: coaches.map((c) => ({
        ...c,
        pendingBookings: c._count.bookings,
        pendingReviews: c._count.videoReviews,
      })),
    });
  });

  // Get coach by ID with available slots
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { from, to } = z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    }).parse(request.query);

    const coach = await prisma.coach.findUnique({
      where: { id },
    });

    if (!coach || !coach.active) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Coach not found',
        },
      });
    }

    // Get available slots
    const now = new Date();
    const startDate = from ? new Date(from) : now;
    const endDate = to ? new Date(to) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const slots = await prisma.coachSlot.findMany({
      where: {
        coachId: id,
        isAvailable: true,
        startAt: { gte: startDate },
        endAt: { lte: endDate },
      },
      orderBy: { startAt: 'asc' },
    });

    return reply.send({
      success: true,
      data: {
        ...coach,
        slots: slots.map((s) => ({
          id: s.id,
          startAt: s.startAt,
          endAt: s.endAt,
        })),
      },
    });
  });

  // Create coach (admin only)
  app.post('/', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createCoachSchema.parse(request.body);

    const coach = await prisma.coach.create({
      data: body,
    });

    return reply.status(201).send({
      success: true,
      data: coach,
    });
  });

  // Update coach (admin only)
  app.patch('/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = updateCoachSchema.parse(request.body);

    const coach = await prisma.coach.update({
      where: { id },
      data: body,
    });

    return reply.send({
      success: true,
      data: coach,
    });
  });

  // Delete coach (admin only)
  app.delete('/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    // Check pending bookings
    const pendingBookings = await prisma.booking.count({
      where: {
        coachId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (pendingBookings > 0) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'HAS_PENDING_BOOKINGS',
          message: 'Cannot delete coach with pending bookings',
        },
      });
    }

    await prisma.coach.delete({
      where: { id },
    });

    return reply.send({
      success: true,
    });
  });

  // Add slots (admin only)
  app.post('/slots', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createSlotsSchema.parse(request.body);

    const slots = await prisma.coachSlot.createMany({
      data: body.slots.map((s) => ({
        coachId: body.coachId,
        startAt: new Date(s.startAt),
        endAt: new Date(s.endAt),
      })),
    });

    return reply.status(201).send({
      success: true,
      data: { created: slots.count },
    });
  });

  // Delete slot (admin only)
  app.delete('/slots/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    // Check if slot has booking
    const booking = await prisma.booking.findFirst({
      where: {
        slotId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (booking) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'SLOT_BOOKED',
          message: 'Cannot delete booked slot',
        },
      });
    }

    await prisma.coachSlot.delete({
      where: { id },
    });

    return reply.send({
      success: true,
    });
  });

  // Get coach slots (admin)
  app.get('/:id/slots', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const query = z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    }).parse(request.query);

    const now = new Date();
    const startDate = query.from ? new Date(query.from) : now;
    const endDate = query.to ? new Date(query.to) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const slots = await prisma.coachSlot.findMany({
      where: {
        coachId: id,
        startAt: { gte: startDate },
        endAt: { lte: endDate },
      },
      orderBy: { startAt: 'asc' },
      include: {
        bookings: {
          where: { status: { in: ['PENDING', 'CONFIRMED'] } },
          include: { user: { select: { id: true, name: true, phone: true } } },
        },
      },
    });

    return reply.send({
      success: true,
      data: slots,
    });
  });
}

