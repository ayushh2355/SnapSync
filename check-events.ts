import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import connectToDatabase from './src/lib/db';
import Event from './src/models/Event';

async function check() {
  await connectToDatabase();
  const events = await Event.find({ _id: { $in: [
    '6a22d93c78578a1bd6d6bf8d',
    '6a257f509f575608d85e5e7d',
    '6a27150938c62338f2b854d6'
  ] } });
  console.log("Existing events:", events.map(e => e._id.toString()));
  process.exit(0);
}
check();
