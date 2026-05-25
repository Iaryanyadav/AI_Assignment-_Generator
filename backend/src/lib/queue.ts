import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const assessmentQueue = new Queue('assessment-generation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

export const CACHE_TTL = 3600; // 1 hour

export async function cacheSet(key: string, value: unknown, ttl = CACHE_TTL): Promise<void> {
  await redis.setex(`vedaai:${key}`, ttl, JSON.stringify(value));
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await redis.get(`vedaai:${key}`);
  if (!data) return null;
  return JSON.parse(data) as T;
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(`vedaai:${key}`);
}
