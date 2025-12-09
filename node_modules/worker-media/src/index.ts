import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };
const mediaQueue = new Queue('media-jobs', { connection });

new Worker(
  'media-jobs',
  async (job) => {
    console.log('Processing media job', job.name, job.data);
    return { status: 'processed' };
  },
  { connection }
);

(async () => {
  await mediaQueue.add('bootstrap', { message: 'Media worker online' });
})();
