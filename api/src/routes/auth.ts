import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { smsProvider } from '../services/sms';
import { generateOtp, getOtpExpiryDate } from '../utils/otp';
import { authenticate } from '../middleware/auth';
import crypto from 'crypto';

const sendCodeSchema = z.object({
  phone: z.string().min(10).max(20),
});

const verifyCodeSchema = z.object({
  phone: z.string().min(10).max(20),
  code: z.string().length(6),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const registerDeviceSchema = z.object({
  token: z.string(),
  platform: z.enum(['ios', 'android']),
});

export async function authRoutes(app: FastifyInstance) {
  // Send verification code
  app.post('/send-code', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = sendCodeSchema.parse(request.body);

    // Validate and normalize phone number
    if (!isValidPhoneNumber(body.phone)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_PHONE',
          message: 'Invalid phone number format',
        },
      });
    }

    const phoneNumber = parsePhoneNumber(body.phone);
    const normalizedPhone = phoneNumber.format('E.164');

    // Generate and store OTP
    const code = generateOtp();
    const expiresAt = getOtpExpiryDate();

    // Delete old codes for this phone
    await prisma.authCode.deleteMany({
      where: { phone: normalizedPhone },
    });

    // Create new code
    await prisma.authCode.create({
      data: {
        phone: normalizedPhone,
        code,
        expiresAt,
      },
    });

    // Send SMS
    const sent = await smsProvider.sendCode(normalizedPhone, code);

    if (!sent) {
      return reply.status(500).send({
        success: false,
        error: {
          code: 'SMS_FAILED',
          message: 'Failed to send verification code',
        },
      });
    }

    // In development or test mode, return the code for testing
    const responseData: { expiresIn: number; code?: string } = {
      expiresIn: config.otp.expiryMinutes * 60,
    };

    if (config.nodeEnv === 'development' || config.testMode) {
      responseData.code = code;
    }

    return reply.send({
      success: true,
      data: responseData,
    });
  });

  // Verify code and login/register
  app.post('/verify-code', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = verifyCodeSchema.parse(request.body);

    if (!isValidPhoneNumber(body.phone)) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_PHONE',
          message: 'Invalid phone number format',
        },
      });
    }

    const phoneNumber = parsePhoneNumber(body.phone);
    const normalizedPhone = phoneNumber.format('E.164');

    // Find valid code
    const authCode = await prisma.authCode.findFirst({
      where: {
        phone: normalizedPhone,
        code: body.code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!authCode) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid or expired verification code',
        },
      });
    }

    // Mark code as verified
    await prisma.authCode.update({
      where: { id: authCode.id },
      data: { verified: true },
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    const isNewUser = !user;

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          country: phoneNumber.country || null,
        },
      });
    }

    // Generate tokens
    const accessToken = app.jwt.sign(
      { sub: user.id, role: user.role },
      { expiresIn: config.jwtExpiresIn }
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshExpiresAt,
      },
    });

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
        isNewUser,
      },
    });
  });

  // Refresh token
  app.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = refreshTokenSchema.parse(request.body);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: body.refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token',
        },
      });
    }

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Generate new tokens
    const accessToken = app.jwt.sign(
      { sub: storedToken.user.id, role: storedToken.user.role },
      { expiresIn: config.jwtExpiresIn }
    );

    const newRefreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        token: newRefreshToken,
        expiresAt: refreshExpiresAt,
      },
    });

    return reply.send({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  });

  // Get current user
  app.get('/me', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          country: user.country,
          createdAt: user.createdAt,
          subscription: user.subscription
            ? {
                status: user.subscription.status,
                plan: user.subscription.plan.name,
                trialEndAt: user.subscription.trialEndAt,
                currentPeriodEndAt: user.subscription.currentPeriodEndAt,
              }
            : null,
        },
      },
    });
  });

  // Update profile
  app.patch('/me', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = updateProfileSchema.parse(request.body);

    const user = await prisma.user.update({
      where: { id: request.userId },
      data: { name: body.name },
    });

    return reply.send({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
        },
      },
    });
  });

  // Register device token for push notifications
  app.post('/device-token', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = registerDeviceSchema.parse(request.body);

    await prisma.deviceToken.upsert({
      where: { token: body.token },
      update: {
        userId: request.userId!,
        platform: body.platform,
      },
      create: {
        userId: request.userId!,
        token: body.token,
        platform: body.platform,
      },
    });

    return reply.send({
      success: true,
    });
  });

  // Logout
  app.post('/logout', { preHandler: authenticate }, async (request: FastifyRequest, reply: FastifyReply) => {
    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: request.userId },
    });

    return reply.send({
      success: true,
    });
  });
}

