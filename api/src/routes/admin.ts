import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function adminRoutes(app: FastifyInstance) {
  // Admin login
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = loginSchema.parse(request.body);

    const admin = await prisma.admin.findUnique({
      where: { email: body.email },
    });

    if (!admin || !verifyPassword(body.password, admin.password)) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    const token = app.jwt.sign(
      { sub: admin.id, role: 'ADMIN', email: admin.email },
      { expiresIn: '24h' }
    );

    return reply.send({
      success: true,
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        },
        token,
      },
    });
  });

  // Create admin (protected - only existing admins)
  app.post('/create', async (request: FastifyRequest, reply: FastifyReply) => {
    // Check authorization
    try {
      const decoded = await request.jwtVerify<{ role: string }>();
      if (decoded.role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Admin access required' },
        });
      }
    } catch {
      // Allow creating first admin if none exist
      const adminCount = await prisma.admin.count();
      if (adminCount > 0) {
        return reply.status(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }
    }

    const body = createAdminSchema.parse(request.body);

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: body.email },
    });

    if (existingAdmin) {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Admin with this email already exists',
        },
      });
    }

    const admin = await prisma.admin.create({
      data: {
        email: body.email,
        password: hashPassword(body.password),
        name: body.name,
      },
    });

    return reply.status(201).send({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  });

  // Get current admin
  app.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = await request.jwtVerify<{ sub: string; role: string }>();
      
      if (decoded.role !== 'ADMIN') {
        return reply.status(403).send({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Admin access required' },
        });
      }

      const admin = await prisma.admin.findUnique({
        where: { id: decoded.sub },
      });

      if (!admin) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Admin not found' },
        });
      }

      return reply.send({
        success: true,
        data: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        },
      });
    } catch {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
      });
    }
  });
}

