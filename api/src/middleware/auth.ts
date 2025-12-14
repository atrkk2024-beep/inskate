import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    userRole?: string;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const decoded = await request.jwtVerify<{ sub: string; role: string }>();
    request.userId = decoded.sub;
    request.userRole = decoded.role;
  } catch (err) {
    return reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
}

export async function optionalAuth(request: FastifyRequest) {
  try {
    const decoded = await request.jwtVerify<{ sub: string; role: string }>();
    request.userId = decoded.sub;
    request.userRole = decoded.role;
  } catch {
    // Token is optional, continue without user
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  
  if (request.userRole !== 'ADMIN') {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }
}

export async function requireSubscriber(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  
  if (!request.userId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { userId: request.userId },
  });

  const hasAccess = subscription && 
    (subscription.status === 'TRIAL' || subscription.status === 'ACTIVE');

  if (!hasAccess) {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Active subscription required',
      },
    });
  }
}

export async function requireCoachOrAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  
  if (request.userRole !== 'ADMIN' && request.userRole !== 'COACH') {
    return reply.status(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Coach or Admin access required',
      },
    });
  }
}

