import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';

const createCategorySchema = z.object({
  title: z.string().min(1).max(100),
  order: z.number().int().optional(),
});

const updateCategorySchema = z.object({
  title: z.string().min(1).max(100).optional(),
  order: z.number().int().optional(),
});

const reorderSchema = z.object({
  categories: z.array(z.object({
    id: z.string(),
    order: z.number().int(),
  })),
});

export async function categoryRoutes(app: FastifyInstance) {
  // List categories (public)
  app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const categories = await prisma.lessonCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            lessons: {
              where: { status: 'PUBLISHED' },
            },
          },
        },
      },
    });

    return reply.send({
      success: true,
      data: categories.map((c) => ({
        id: c.id,
        title: c.title,
        order: c.order,
        lessonCount: c._count.lessons,
      })),
    });
  });

  // Get category with lessons
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const category = await prisma.lessonCategory.findUnique({
      where: { id },
      include: {
        lessons: {
          where: { status: 'PUBLISHED' },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            durationSec: true,
            thumbnailUrl: true,
            isFree: true,
            order: true,
          },
        },
      },
    });

    if (!category) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found',
        },
      });
    }

    return reply.send({
      success: true,
      data: category,
    });
  });

  // Create category (admin only)
  app.post('/', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = createCategorySchema.parse(request.body);

    // Get max order if not provided
    let order = body.order;
    if (order === undefined) {
      const maxOrder = await prisma.lessonCategory.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = (maxOrder?.order ?? -1) + 1;
    }

    const category = await prisma.lessonCategory.create({
      data: {
        title: body.title,
        order,
      },
    });

    return reply.status(201).send({
      success: true,
      data: category,
    });
  });

  // Update category (admin only)
  app.patch('/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = updateCategorySchema.parse(request.body);

    const category = await prisma.lessonCategory.update({
      where: { id },
      data: body,
    });

    return reply.send({
      success: true,
      data: category,
    });
  });

  // Delete category (admin only)
  app.delete('/:id', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    await prisma.lessonCategory.delete({
      where: { id },
    });

    return reply.send({
      success: true,
    });
  });

  // Reorder categories (admin only)
  app.post('/reorder', { preHandler: requireAdmin }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = reorderSchema.parse(request.body);

    await prisma.$transaction(
      body.categories.map((c) =>
        prisma.lessonCategory.update({
          where: { id: c.id },
          data: { order: c.order },
        })
      )
    );

    return reply.send({
      success: true,
    });
  });
}

