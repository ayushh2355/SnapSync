import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import connectToDatabase from './src/lib/db';
import UserReference from './src/models/UserReference';
import Media from './src/models/Media';

async function check() {
  await connectToDatabase();
  const userRefs = await UserReference.find({});
  console.log(`Found ${userRefs.length} UserReferences.`);
  for (const ref of userRefs) {
    console.log(`User ${ref.userId}: has faceDescriptor? ${!!ref.faceDescriptor}, length: ${ref.faceDescriptor?.length}`);
  }

  const media = await Media.find({}).sort({ createdAt: -1 }).limit(10);
  console.log(`\nFound ${media.length} recent Media items.`);
  for (const m of media) {
    console.log(`Media ${m._id}: fileType: ${m.fileType}, tags: ${m.tags?.length}, faceDescriptors: ${m.faceDescriptors?.length}, detectedUsers: ${m.detectedUsers?.length}`);
  }
  process.exit(0);
}
check();
