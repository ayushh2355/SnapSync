import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import connectToDatabase from './src/lib/db';
import UserReference from './src/models/UserReference';
import Media from './src/models/Media';

async function check() {
  await connectToDatabase();
  const media = await Media.find({}).sort({ createdAt: -1 }).limit(10);
  console.log(`Found ${media.length} recent Media items.`);
  for (const m of media) {
    console.log(`Media ${m._id}: fileType: ${m.fileType}, tags: ${m.tags?.length}, faceDescriptors: ${m.faceDescriptors?.length}, detectedUsers: ${m.detectedUsers?.length}`);
  }
  process.exit(0);
}
check();
