import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as faceapi from '@vladmandic/face-api';
import { Canvas, Image, ImageData, createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import Media from '@/models/Media';
import { S3Service } from '@/services/s3.service';
import { FaceService } from '@/services/face.service';
import { NotificationService } from '@/services/notification.service';
import { VisionService } from '@/services/vision.service';

// Monkey-patch face-api for Node.js environment using canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData } as any);

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

const mediaQueueName = 'media-processing-queue';

let modelsLoaded = false;
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

async function loadModels() {
  if (modelsLoaded) return;
  console.log('Worker loading face-api.js models...');
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  modelsLoaded = true;
  console.log('Worker loaded models successfully.');
}

export const mediaWorker = new Worker(mediaQueueName, async (job) => {
  const { mediaId, s3Key, mimeType, uploadedBy } = job.data;
  console.log(`[MediaWorker] Processing job ${job.id} for media ${mediaId}`);

  try {
    console.log(`[MediaWorker ${job.id}] Connecting to DB...`);
    await connectToDatabase();
    
    console.log(`[MediaWorker ${job.id}] Loading models...`);
    await loadModels();

    console.log(`[MediaWorker ${job.id}] Downloading buffer from Cloudinary (key: ${s3Key})...`);
    // 1. Download buffer from S3
    const buffer = await S3Service.getFileBuffer(s3Key);

    console.log(`[MediaWorker ${job.id}] Generating AI tags via Gemini...`);
    // 2. Extract AI Tags via Gemini
    const aiTags = await VisionService.generateTags(buffer, mimeType);

    console.log(`[MediaWorker ${job.id}] Resizing image...`);
    // 3. Resize image to prevent memory explosion during face extraction
    const resizedBuffer = await sharp(buffer)
      .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
      .toFormat('jpeg')
      .toBuffer();

    console.log(`[MediaWorker ${job.id}] Loading image into canvas...`);
    // 4. Load resized buffer into Node.js Canvas
    const img = await loadImage(resizedBuffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);

    console.log(`[MediaWorker ${job.id}] Running face detection...`);
    // 5. Detect faces and extract descriptors
    const detections = await faceapi
      .detectAllFaces(canvas as any, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    const targetDescriptors = detections.map(d => Array.from(d.descriptor));

    // 6. Match against existing users
    const matchedUserIds = await FaceService.matchFacesAgainstUsers(targetDescriptors);

    // 7. Update Media record with AI Tags, Descriptors, and Detected Users
    await Media.findByIdAndUpdate(mediaId, {
      $addToSet: { tags: { $each: aiTags }, detectedUsers: { $each: matchedUserIds } },
      $set: { faceDescriptors: targetDescriptors }
    });

    // 8. Fire Notifications for auto-tagged users
    for (const taggedUserId of matchedUserIds) {
      if (taggedUserId.toString() !== uploadedBy.toString()) {
        await NotificationService.createNotification({
          recipientId: taggedUserId,
          actorId: uploadedBy,
          type: 'tag',
          mediaId: mediaId,
        });
      }
    }

    console.log(`[MediaWorker] Successfully processed media ${mediaId}`);
    return { success: true, matchedUsers: matchedUserIds.length };

  } catch (error) {
    console.error(`[MediaWorker] Error processing job ${job.id}:`, error);
    throw error;
  }
}, { connection });

mediaWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error ${err.message}`);
});

console.log(`[MediaWorker] Started successfully! Listening on queue: ${mediaQueueName}`);
