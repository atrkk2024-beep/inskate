import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config';
import { prisma } from './lib/prisma';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { categoryRoutes } from './routes/categories';
import { lessonRoutes } from './routes/lessons';
import { commentRoutes } from './routes/comments';
import { planRoutes } from './routes/plans';
import { subscriptionRoutes } from './routes/subscriptions';
import { coachRoutes } from './routes/coaches';
import { bookingRoutes } from './routes/bookings';
import { videoReviewRoutes } from './routes/video-reviews';
import { supportRoutes } from './routes/support';
import { pushRoutes } from './routes/push';
import { adminRoutes } from './routes/admin';
import { analyticsRoutes } from './routes/analytics';
import { webhookRoutes } from './routes/webhooks';
import { errorHandler } from './middleware/error-handler';
import { startScheduler } from './jobs/push-scheduler';

const app = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'debug' : 'info',
  },
});

// Register plugins
async function registerPlugins() {
  // CORS
  await app.register(cors, {
    origin: config.nodeEnv === 'development' ? true : [config.adminUrl],
    credentials: true,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // JWT
  await app.register(jwt, {
    secret: config.jwtSecret,
    sign: {
      expiresIn: config.jwtExpiresIn,
    },
  });

  // Swagger documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'InSkate API',
        description: 'API for InSkate Online Figure Skating School',
        version: '2.0.0',
      },
      servers: [
        {
          url: config.apiUrl,
          description: config.nodeEnv === 'development' ? 'Development' : 'Production',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}

// Register routes
async function registerRoutes() {
  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(categoryRoutes, { prefix: '/api/categories' });
  await app.register(lessonRoutes, { prefix: '/api/lessons' });
  await app.register(commentRoutes, { prefix: '/api/comments' });
  await app.register(planRoutes, { prefix: '/api/plans' });
  await app.register(subscriptionRoutes, { prefix: '/api/subscriptions' });
  await app.register(coachRoutes, { prefix: '/api/coaches' });
  await app.register(bookingRoutes, { prefix: '/api/bookings' });
  await app.register(videoReviewRoutes, { prefix: '/api/video-reviews' });
  await app.register(supportRoutes, { prefix: '/api/support' });
  await app.register(pushRoutes, { prefix: '/api/push' });
  await app.register(adminRoutes, { prefix: '/api/admin' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });
  await app.register(webhookRoutes, { prefix: '/webhooks' });
}

// Error handler
app.setErrorHandler(errorHandler);

// Graceful shutdown
async function shutdown() {
  await prisma.$disconnect();
  await app.close();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    await app.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    console.log(`🚀 Server running at http://localhost:${config.port}`);
    console.log(`📚 API docs at http://localhost:${config.port}/docs`);

    // Start push notification scheduler
    startScheduler();
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

