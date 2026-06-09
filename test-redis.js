const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis('redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

const q = new Queue('test', { connection });

async function run() {
  console.log("Adding to queue...");
  try {
    const job = await q.add('job', { foo: 'bar' });
    console.log("Added job:", job.id);
  } catch(e) {
    console.log("Error:", e);
  }
  process.exit(0);
}
run();
