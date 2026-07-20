import { Queue, QueueEvents } from 'bullmq'
import Redis from 'ioredis'

// Connect to Redis (localhost by default for local dev)
export const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null, // Required by bullmq
})

export const INVENTORY_QUEUE_NAME = 'inventory-adjustment-queue'

export const inventoryQueue = new Queue(INVENTORY_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

export const inventoryQueueEvents = new QueueEvents(INVENTORY_QUEUE_NAME, {
  connection,
})
