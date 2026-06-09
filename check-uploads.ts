import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import connectToDatabase from './src/lib/db';
import User from './src/models/User';
import Media from './src/models/Media';

async function check() {
  await connectToDatabase();
  const user = await User.findOne({ email: 'ayushhpatel.2354@gmail.com' });
  if (!user) {
    console.log("User not found");
    process.exit(0);
  }
  console.log("User ID:", user._id);
  const count = await Media.countDocuments({ uploadedBy: user._id });
  console.log("Exact uploaded count in DB:", count);
  const allMedia = await Media.find({ uploadedBy: user._id }).select('fileType accessType createdAt eventId');
  console.log("Media records:", JSON.stringify(allMedia, null, 2));
  
  // What about total public count?
  const totalPublic = await Media.countDocuments({ accessType: 'public' });
  console.log("Total public media in whole system:", totalPublic);
  process.exit(0);
}
check();
