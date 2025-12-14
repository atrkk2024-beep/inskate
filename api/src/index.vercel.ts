// Vercel Serverless Adapter for Fastify
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { config } from './config';
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
import type { VercelRequest, VercelResponse } from '@vercel/node';

const app = Fastify({
  logger: true,
});

// Register plugins
async function registerPlugins() {
  await app.register(cors, {
    origin: [
      config.adminUrl,
      /\.vercel\.app$/,
      /localhost:\d+$/,
    ],
    credentials: true,
  });

  await app.register(jwt, {
    secret: config.jwtSecret,
    sign: { expiresIn: config.jwtExpiresIn },
  });
}

// Register routes
async function registerRoutes() {
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  app.get('/', async () => ({ message: 'InSkate API v2.0' }));

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

app.setErrorHandler(errorHandler);

// Initialize
let isReady = false;
async function init() {
  if (!isReady) {
    await registerPlugins();
    await registerRoutes();
    await app.ready();
    isReady = true;
  }
}

// Vercel serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await init();
  
  // Convert Vercel request to Fastify format
  const response = await app.inject({
    method: req.method as any,
    url: req.url || '/',
    headers: req.headers as any,
    payload: req.body,
    query: req.query as any,
  });

  // Set response headers
  for (const [key, value] of Object.entries(response.headers)) {
    if (value) res.setHeader(key, value);
  }

  res.status(response.statusCode).send(response.payload);
}

