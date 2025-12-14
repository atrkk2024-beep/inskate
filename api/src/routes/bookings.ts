import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getPaginationParams, createPaginationMeta } from '../utils/pagination';
import { sendPushNotification } from '../services/push';

const createBookingSchema = z.object({
  coachId: z.string(),
  slotId: z.string(),
  type: z.enum(['SINGLE', 'PACKAGE']).default('SINGLE'),
  packageId: z.string().optional(),
  notes: z.string().optional(),
});

const listBookingsQuery = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED', 'NO_SHOW']).optional(),
  coachId: z.string().optional(),
  userId: z.string().optional(),
});

export async function bookingRoutes(app: FastifyInstance) {
  // Get user's bookings
  app.get('/me', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED', 'NO_SHOW']).optional(),
    }).parse(request.query);

    const where: any = { userId: request.userId };
    if (query.status) {
      where.status = query.status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        coach: { select: { id: true, name: true, avatarUrl: true } },
        slot: { select: { id: true, startAt: true, endAt: true } },
      },
    });

    return reply.send({
      success: true,
      data: bookings.map((b) => ({
        id: b.id,
        coach: b.coach,
        slot: b.slot,
        type: b.type,
        status: b.status,
        price: b.price,
        currency: b.currency,
        paymentStatus: b.paymentStatus,
        createdAt: b.createdAt,
      })),
    });
  });

  // Get user's packages
  app.get('/packages', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const packages = await prisma.bookingPackage.findMany({
      where: {
        userId: request.userId,
        remaining: { gt: 0 },
        expiresAt: { gt: new Date() },
      },
      include: {
        coach: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return reply.send({
      success: true,
      data: packages,
    });
  });

  // Create booking
  app.post('/', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createBookingSchema.parse(request.body);

    // Check if slot exists and is available
    const slot = await prisma.coachSlot.findUnique({
      where: { id: body.slotId },
      include: { coach: true },
    });

    if (!slot || !slot.isAvailable || slot.coachId !== body.coachId) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'SLOT_NOT_AVAILABLE',
          message: 'Slot is not available',
        },
      });
    }

    // Check if slot is in the future
    if (slot.startAt < new Date()) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'SLOT_IN_PAST',
          message: 'Cannot book a slot in the past',
        },
      });
    }

    let packageId = body.packageId;
    let price = 0;
    let paymentStatus = 'PENDING';

    // If using package, validate and decrement
    if (body.type === 'PACKAGE' && body.packageId) {
      const pkg = await prisma.bookingPackage.findUnique({
        where: { id: body.packageId },
      });

      if (!pkg || pkg.userId !== request.userId || pkg.coachId !== body.coachId) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_PACKAGE',
            message: 'Invalid or unauthorized package',
          },
        });
      }

      if (pkg.remaining <= 0 || pkg.expiresAt < new Date()) {
        return reply.status(400).send({
          success: false,
          error: {
            code: 'PACKAGE_EXHAUSTED',
            message: 'Package has no remaining sessions or has expired',
          },
        });
      }

      // Decrement package
      await prisma.bookingPackage.update({
        where: { id: body.packageId },
        data: { remaining: { decrement: 1 } },
      });

      paymentStatus = 'PAID';
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: request.userId!,
        coachId: body.coachId,
        slotId: body.slotId,
        packageId,
        type: body.type,
        status: 'PENDING',
        price,
        paymentStatus: paymentStatus as any,
        notes: body.notes,
      },
      include: {
        coach: { select: { id: true, name: true } },
        slot: true,
      },
    });

    // Mark slot as unavailable
    await prisma.coachSlot.update({
      where: { id: body.slotId },
      data: { isAvailable: false },
    });

    return reply.status(201).send({
      success: true,
      data: booking,
    });
  });

  // Cancel booking
  app.post('/:id/cancel', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { slot: true },
    });

    if (!booking) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Booking not found' },
      });
    }

    if (booking.userId !== request.userId && request.userRole !== 'ADMIN') {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Cannot cancel this booking' },
      });
    }

    if (booking.status === 'CANCELED' || booking.status === 'COMPLETED') {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Cannot cancel this booking' },
      });
    }

    // Restore package session if applicable
    if (booking.type === 'PACKAGE' && booking.packageId) {
      await prisma.bookingPackage.update({
        where: { id: booking.packageId },
        data: { remaining: { increment: 1 } },
      });
    }

    // Update booking status
    await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELED' },
    });

    // Make slot available again
    await prisma.coachSlot.update({
      where: { id: booking.slotId },
      data: { isAvailable: true },
    });

    return reply.send({
      success: true,
    });
  });

  // List all bookings (admin)
  app.get('/', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = listBookingsQuery.parse(request.query);
    const { page, limit, skip } = getPaginationParams(query);

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.coachId) where.coachId = query.coachId;
    if (query.userId) where.userId = query.userId;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true } },
          coach: { select: { id: true, name: true } },
          slot: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: bookings,
      meta: createPaginationMeta(page, limit, total),
    });
  });

  // Update booking status (admin)
  app.patch('/:id/status', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { status } = z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELED', 'NO_SHOW']),
    }).parse(request.body);

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { user: true, coach: true, slot: true },
    });

    // Send push notification
    if (status === 'CONFIRMED') {
      const tokens = await prisma.deviceToken.findMany({
        where: { userId: booking.userId },
        select: { token: true },
      });

      if (tokens.length > 0) {
        await sendPushNotification({
          tokens: tokens.map((t) => t.token),
          title: 'Тренировка подтверждена',
          body: `Ваша тренировка с ${booking.coach.name} подтверждена`,
          data: { type: 'booking', bookingId: booking.id },
        });
      }
    }

    return reply.send({
      success: true,
      data: booking,
    });
  });
}

