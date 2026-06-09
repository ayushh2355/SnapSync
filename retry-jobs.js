const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis('redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

const q = new Queue('media-processing-queue', { connection });

async function run() {
  const failedJobs = await q.getFailed(0, 100);
  console.log(`Found ${failedJobs.length} failed jobs. Retrying...`);
  
  for (const job of failedJobs) {
    await job.retry();
    console.log(`Retried job ${job.id}`);
  }
  
  console.log("All failed jobs moved back to waiting.");
  process.exit(0);
}
run();
