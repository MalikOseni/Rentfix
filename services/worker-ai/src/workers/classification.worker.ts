/**
 * AI Classification Worker
 * Processes image classification jobs asynchronously using Bull queue
 */

import { Worker, Job } from 'bullmq';
import { AIJobPayload } from '@rentfix/types';
import { AIService } from '../services/ai.service';

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
};

const aiService = new AIService();

/**
 * Worker that processes AI classification jobs
 */
export const classificationWorker = new Worker(
  'ai-classification',
  async (job: Job<AIJobPayload>) => {
    const { ticketId, imageUrl, tenantDescription, propertyType } = job.data;

    console.log(`[Worker] Processing AI classification for ticket ${ticketId}`);

    try {
      // Perform AI analysis
      const classification = await aiService.analyzeImage({
        ticketId,
        imageUrl,
        tenantDescription,
        propertyType,
      });

      // Check if human review is needed
      const requiresReview = aiService.isHumanReviewRequired(classification);

      console.log(
        `[Worker] Classification complete for ticket ${ticketId}:`,
        {
          issueType: classification.issueType,
          trade: classification.trade,
          severity: classification.severity,
          confidence: classification.confidence,
          requiresReview,
        }
      );

      // Return result (will be stored in job result)
      return {
        ticketId,
        classification,
        requiresReview,
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(
        `[Worker] Classification failed for ticket ${ticketId}:`,
        error
      );

      // Throw error to mark job as failed (Bull will retry based on settings)
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process up to 5 jobs concurrently
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Remove after 24 hours
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs for debugging
    },
  }
);

// Event handlers for monitoring
classificationWorker.on('completed', (job, result) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

classificationWorker.on('failed', (job, error) => {
  console.error(`[Worker] Job ${job?.id} failed:`, error.message);
});

classificationWorker.on('error', (error) => {
  console.error('[Worker] Worker error:', error);
});

console.log('AI Classification Worker started');
