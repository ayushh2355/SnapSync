import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import connectToDatabase from './src/lib/db';
import UserReference from './src/models/UserReference';

async function run() {
  await connectToDatabase();
  console.log('Connected to DB.');
  const refs = await UserReference.find().lean();
  console.log('User References found:', refs);
  process.exit(0);
}

run();
