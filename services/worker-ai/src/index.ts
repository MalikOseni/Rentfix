/**
 * AI Worker Service
 * Handles async image classification and triage using Bull queue
 */

import { Queue } from 'bullmq';
import dotenv from 'dotenv';
import { AIJobPayload } from '@rentfix/types';

// Load environment variables
dotenv.config();

// Redis connection
const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };

// ============================================================================
// AI CLASSIFICATION QUEUE
// ============================================================================

export const aiClassificationQueue = new Queue<AIJobPayload>('ai-classification', {
  connection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 second delay, doubles each retry
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// ============================================================================
// QUEUE MANAGEMENT
// ============================================================================

/**
 * Add an image classification job to the queue
 */
export async function enqueueClassification(
  payload: AIJobPayload,
  priority?: number
): Promise<string> {
  const job = await aiClassificationQueue.add('classify-image', payload, {
    priority, // Higher priority jobs are processed first
  });

  console.log(`Enqueued classification job ${job.id} for ticket ${payload.ticketId}`);
  return job.id as string;
}

/**
 * Get job status and result
 */
export async function getClassificationResult(jobId: string) {
  const job = await aiClassificationQueue.getJob(jobId);

  if (!job) {
    return { status: 'not_found' };
  }

  const state = await job.getState();
  const progress = job.progress;

  if (state === 'completed') {
    return {
      status: 'completed',
      result: await job.returnvalue,
    };
  }

  if (state === 'failed') {
    return {
      status: 'failed',
      error: job.failedReason,
      attempts: job.attemptsMade,
    };
  }

  return {
    status: state,
    progress,
  };
}

// ============================================================================
// WORKER INITIALIZATION
// ============================================================================

/**
 * Start the classification worker
 * This must be called to begin processing jobs
 */
export async function startWorker() {
  // Import worker (dynamic to avoid circular dependencies)
  await import('./workers/classification.worker');
  console.log('✓ AI Classification Worker initialized');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

(async () => {
  try {
    console.log('Starting AI Worker Service...');

    // Test Redis connection
    await aiClassificationQueue.waitUntilReady();
    console.log('✓ Connected to Redis');

    // Start the worker
    await startWorker();

    console.log('✓ AI Worker Service is ready');
    console.log(`Queue: ai-classification`);
    console.log(`Redis: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Shutting down AI Worker...');
      await aiClassificationQueue.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('Shutting down AI Worker...');
      await aiClassificationQueue.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start AI Worker:', error);
    process.exit(1);
  }
})();
