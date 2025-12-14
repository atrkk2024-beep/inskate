import Bull from 'bull';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { sendPushToSegment } from '../services/push';

// Create queue for scheduled push notifications
export const pushQueue = new Bull('push-notifications', config.redisUrl, {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
  },
});

// Process jobs
pushQueue.process(async (job) => {
  const { notificationId } = job.data;

  const notification = await prisma.pushNotification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.sentAt) {
    return { skipped: true };
  }

  const result = await sendPushToSegment({
    segment: notification.segment as 'all' | 'subscribers' | 'non_subscribers',
    title: notification.title,
    body: notification.body,
    data: notification.data as Record<string, string> | undefined,
  });

  await prisma.pushNotification.update({
    where: { id: notificationId },
    data: { sentAt: new Date() },
  });

  return result;
});

// Schedule pending notifications
export async function scheduleNotifications() {
  const pending = await prisma.pushNotification.findMany({
    where: {
      scheduledAt: { not: null },
      sentAt: null,
    },
  });

  for (const notification of pending) {
    if (!notification.scheduledAt) continue;

    const delay = notification.scheduledAt.getTime() - Date.now();
    if (delay > 0) {
      await pushQueue.add(
        { notificationId: notification.id },
        { delay, jobId: notification.id }
      );
    }
  }
}

// Daily check for scheduled notifications at 05:00 MSK
export function startScheduler() {
  // Check every minute for due notifications
  setInterval(async () => {
    const now = new Date();
    const pending = await prisma.pushNotification.findMany({
      where: {
        scheduledAt: { lte: now },
        sentAt: null,
      },
    });

    for (const notification of pending) {
      await pushQueue.add({ notificationId: notification.id });
    }
  }, 60 * 1000); // Every minute

  console.log('Push notification scheduler started');
}

