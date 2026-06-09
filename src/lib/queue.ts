import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// Use a fallback to local redis if REDIS_URL is not provided
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null, // Required by bullmq
});

export const mediaQueueName = 'media-processing-queue';

export const mediaQueue = new Queue(mediaQueueName, {
  connection,
});

export const mediaQueueEvents = new QueueEvents(mediaQueueName, {
  connection,
});
