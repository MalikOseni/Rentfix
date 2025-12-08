import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const connection = { url: process.env.REDIS_URL || 'redis://localhost:6379' };
const reportQueue = new Queue('reporting-jobs', { connection });

new Worker(
  'reporting-jobs',
  async (job) => {
    console.log('Processing reporting job', job.name, job.data);
    return { status: 'processed' };
  },
  { connection }
);

(async () => {
  await reportQueue.add('bootstrap', { message: 'Reporting worker online' });
})();
