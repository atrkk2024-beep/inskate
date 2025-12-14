import Redis from 'ioredis';
import { config } from '../config';

let redis: Redis | null = null;

// In-memory fallback for serverless environments
const memoryStore = new Map<string, { value: string; expiry: number }>();

export function getRedis(): Redis | null {
  if (redis) return redis;
  
  // Skip Redis in serverless if no valid URL
  if (!config.redisUrl || config.redisUrl.includes('localhost')) {
    console.log('Redis not available, using in-memory store');
    return null;
  }

  try {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    return redis;
  } catch (err) {
    console.error('Failed to create Redis client:', err);
    return null;
  }
}

// Helper functions that work with both Redis and memory
export async function setWithExpiry(key: string, value: string, expirySeconds: number): Promise<void> {
  const client = getRedis();
  if (client) {
    await client.setex(key, expirySeconds, value);
  } else {
    memoryStore.set(key, { value, expiry: Date.now() + expirySeconds * 1000 });
  }
}

export async function getValue(key: string): Promise<string | null> {
  const client = getRedis();
  if (client) {
    return client.get(key);
  } else {
    const item = memoryStore.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  }
}

export async function deleteKey(key: string): Promise<void> {
  const client = getRedis();
  if (client) {
    await client.del(key);
  } else {
    memoryStore.delete(key);
  }
}

