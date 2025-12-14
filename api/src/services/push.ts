import admin from 'firebase-admin';
import { config } from '../config';
import { prisma } from '../lib/prisma';

// Initialize Firebase Admin
let firebaseInitialized = false;

function initFirebase() {
  if (firebaseInitialized) return;
  
  if (config.firebase.projectId && config.firebase.privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        privateKey: config.firebase.privateKey,
        clientEmail: config.firebase.clientEmail,
      }),
    });
    firebaseInitialized = true;
  }
}

export async function sendPushNotification(params: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ successCount: number; failureCount: number }> {
  initFirebase();
  
  if (!firebaseInitialized || params.tokens.length === 0) {
    console.log('[MOCK PUSH]', params);
    return { successCount: params.tokens.length, failureCount: 0 };
  }

  const message: admin.messaging.MulticastMessage = {
    tokens: params.tokens,
    notification: {
      title: params.title,
      body: params.body,
    },
    data: params.data,
    android: {
      priority: 'high',
    },
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default',
        },
      },
    },
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  
  // Remove invalid tokens
  const tokensToRemove: string[] = [];
  response.responses.forEach((resp, idx) => {
    if (!resp.success) {
      const error = resp.error;
      if (
        error?.code === 'messaging/invalid-registration-token' ||
        error?.code === 'messaging/registration-token-not-registered'
      ) {
        tokensToRemove.push(params.tokens[idx]);
      }
    }
  });

  if (tokensToRemove.length > 0) {
    await prisma.deviceToken.deleteMany({
      where: { token: { in: tokensToRemove } },
    });
  }

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
  };
}

export async function sendPushToSegment(params: {
  segment: 'all' | 'subscribers' | 'non_subscribers';
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ successCount: number; failureCount: number }> {
  let whereClause = {};

  if (params.segment === 'subscribers') {
    whereClause = {
      user: {
        subscription: {
          status: { in: ['TRIAL', 'ACTIVE'] },
        },
      },
    };
  } else if (params.segment === 'non_subscribers') {
    whereClause = {
      user: {
        OR: [
          { subscription: null },
          { subscription: { status: { notIn: ['TRIAL', 'ACTIVE'] } } },
        ],
      },
    };
  }

  const deviceTokens = await prisma.deviceToken.findMany({
    where: whereClause,
    select: { token: true },
  });

  const tokens = deviceTokens.map((dt) => dt.token);

  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  // Send in batches of 500 (FCM limit)
  const batchSize = 500;
  let totalSuccess = 0;
  let totalFailure = 0;

  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    const result = await sendPushNotification({
      tokens: batch,
      title: params.title,
      body: params.body,
      data: params.data,
    });
    totalSuccess += result.successCount;
    totalFailure += result.failureCount;
  }

  return { successCount: totalSuccess, failureCount: totalFailure };
}

