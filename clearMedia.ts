import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load the local .env.local file
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function clearMedia() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not set');
    }

    await mongoose.connect(uri);
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    
    // Clear the medias collection
    if (db) {
      await db.collection('media').deleteMany({});
      console.log('Successfully deleted all trash media from database.');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

clearMedia();
