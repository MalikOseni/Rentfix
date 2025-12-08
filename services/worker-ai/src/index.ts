import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };
const aiQueue = new Queue('ai-jobs', { connection });

new Worker(
  'ai-jobs',
  async (job) => {
    console.log('Processing AI job', job.name, job.data);
    return { status: 'processed' };
  },
  { connection }
);

(async () => {
  await aiQueue.add('bootstrap', { message: 'AI worker online' });
})();
