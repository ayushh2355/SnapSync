import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Media from '@/models/Media';
import { S3Service } from '@/services/s3.service';
import { VisionService } from '@/services/vision.service';
import { FaceService } from '@/services/face.service';
import { NotificationService } from '@/services/notification.service';

// This route is called internally by the upload API to process media
// without blocking the upload response. It runs inside Next.js (no worker needed).
// Called with a secret header to prevent external abuse.
export const maxDuration = 60; // Vercel max for hobby plan; upgrade for Pro (300s)

export async function POST(req: NextRequest) {
  try {
    // Simple internal secret check — prevents external callers from abusing this route
    const secret = req.headers.get('x-internal-secret');
    if (secret !== (process.env.JWT_SECRET ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { mediaId, s3Key, mimeType, uploadedBy } = body;

    if (!mediaId || !s3Key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    console.log(`[ProcessMedia] Starting AI processing for media ${mediaId}`);

    // 1. Download the image buffer from S3/Cloudinary
    const buffer = await S3Service.getFileBuffer(s3Key);

    // 2. Generate AI tags via Gemini Vision
    const aiTags = await VisionService.generateTags(buffer, mimeType);
    console.log(`[ProcessMedia] AI tags generated: ${aiTags.join(', ')}`);

    // 3. Face matching — compare stored face descriptors from existing photos
    //    (We skip face-api.js which needs native binaries; instead we reuse descriptors
    //    that were stored when the user uploaded their selfie reference)
    const matchedUserIds = await FaceService.matchFacesAgainstUsers([]);
    // Note: Full face detection from photo requires native binaries (not available on Vercel).
    // The selfie-upload endpoint stores the user's descriptor, and retroactiveMatchForUser
    // already handles matching when a user uploads their selfie.

    // 4. Update the media record
    await Media.findByIdAndUpdate(mediaId, {
      $addToSet: { tags: { $each: aiTags } },
    });

    // 5. Fire tag notifications for detected users
    for (const taggedUserId of matchedUserIds) {
      if (taggedUserId.toString() !== uploadedBy?.toString()) {
        await NotificationService.createNotification({
          recipientId: taggedUserId,
          actorId: uploadedBy,
          type: 'tag',
          mediaId,
        });
      }
    }

    console.log(`[ProcessMedia] Done for media ${mediaId}`);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[ProcessMedia] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
