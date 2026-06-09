const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis('redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

const q = new Queue('media-processing-queue', { connection });

async function run() {
  const waiting = await q.getWaitingCount();
  const active = await q.getActiveCount();
  const completed = await q.getCompletedCount();
  const failed = await q.getFailedCount();
  const delayed = await q.getDelayedCount();
  
  console.log(`Waiting: ${waiting}`);
  console.log(`Active: ${active}`);
  console.log(`Completed: ${completed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Delayed: ${delayed}`);

  if (failed > 0) {
    const failedJobs = await q.getFailed(0, 5);
    for (const job of failedJobs) {
      console.log(`Failed Job ${job.id}:`, job.failedReason);
    }
  }
  process.exit(0);
}
run();
