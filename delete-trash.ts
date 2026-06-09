import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import connectToDatabase from './src/lib/db';
import User from './src/models/User';
import Media from './src/models/Media';
import { S3Service } from './src/services/s3.service';

async function deleteTrash() {
  await connectToDatabase();
  const user = await User.findOne({ email: 'ayushhpatel.2354@gmail.com' });
  if (!user) {
    console.log("User not found");
    process.exit(0);
  }
  
  const allMedia = await Media.find({ uploadedBy: user._id });
  console.log(`Found ${allMedia.length} media items to delete.`);
  
  for (const m of allMedia) {
    try {
      await S3Service.deleteFile(m.s3Key);
    } catch (e) {
      console.log(`Failed to delete S3 file ${m.s3Key}, it might already be gone.`);
    }
    await Media.findByIdAndDelete(m._id);
  }
  
  console.log("Deleted all trash images successfully.");
  process.exit(0);
}
deleteTrash();
