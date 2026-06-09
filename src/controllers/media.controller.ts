import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import { S3Service } from '@/services/s3.service';
import { MediaService } from '@/services/media.service';
import { VisionService } from '@/services/vision.service';
import { FaceService } from '@/services/face.service';
import { SharingService } from '@/services/sharing.service';
import { NotificationService } from '@/services/notification.service';
import crypto from 'crypto';
import sharp from 'sharp';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
]);
const ALLOWED_ACCESS_TYPES = new Set(['public', 'private']);
const PRIVILEGED_ROLES = new Set(['Admin', 'Photographer', 'Club Member']);

function safeParseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export class MediaController {
  static async uploadMedia(req: NextRequest) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const eventId = formData.get('eventId') as string | null;
      const rawAccessType = formData.get('accessType') as string | null;
      const rawTags = formData.get('tags') as string | null;

      if (!file || !eventId) {
        return NextResponse.json({ success: false, error: 'File and eventId are required' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: 'File exceeds 10MB limit' }, { status: 400 });
      }

      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });
      }

      const accessType = ALLOWED_ACCESS_TYPES.has(rawAccessType ?? '')
        ? (rawAccessType as 'public' | 'private')
        : 'public';

      const initialTags = safeParseJSON<string[]>(rawTags, []);
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';

      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
      const isDuplicate = await MediaService.checkDuplicate(eventId, fileHash);
      if (isDuplicate) {
        return NextResponse.json({ success: false, error: 'Duplicate media detected for this event' }, { status: 409 });
      }

      let processedBuffer: Buffer = buffer;
      let processedMime = file.type;

      if (file.type === 'image/heic' || file.type === 'image/heif') {
        try {
          processedBuffer = (await sharp(buffer).jpeg().toBuffer()) as unknown as Buffer;
          processedMime = 'image/jpeg';
        } catch {
          processedBuffer = buffer;
          processedMime = file.type;
        }
      }

      let finalTags = [...initialTags];
      let detectedUsers: string[] = [];

      if (fileType === 'image') {
        // AI processing will be handled by the background worker
        // to prevent blocking the Node.js event loop
      }

      const { url, key } = await S3Service.uploadFile(processedBuffer, processedMime, file.name);
      
      try {
        const mediaRecord = await MediaService.createMediaRecord({
          eventId,
          uploadedBy: user.id,
          fileUrl: url,
           s3Key: key, 
          mimeType: processedMime,
          fileType,
          accessType,
          tags: finalTags,
          detectedUsers: [], // Will be populated by the worker
          hash: fileHash,
        });

        if (fileType === 'image') {
          const { mediaQueue } = await import('@/lib/queue');
          await mediaQueue.add('PROCESS_MEDIA', {
            mediaId: mediaRecord._id.toString(),
            s3Key: key,
            mimeType: processedMime,
            uploadedBy: user.id,
          });
        }

        return NextResponse.json({ success: true, data: mediaRecord }, { status: 201 });
      } catch (dbError: unknown) {
        S3Service.deleteFile(key).catch((cleanupErr) => {
          console.error(`S3 cleanup failed for key ${key}:`, cleanupErr);
        });
        throw dbError;
      }
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }

  static async getEventMedia(req: NextRequest, eventId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      const { searchParams } = new URL(req.url);
      const token = searchParams.get('shareToken');

      let includePrivate = false;

      if (token && SharingService.verifyShareToken(token) === eventId) {
        includePrivate = true;
      }

      if (!includePrivate && user && PRIVILEGED_ROLES.has(user.role)) {
        includePrivate = true;
      }

      const media = await MediaService.getMediaForEvent(eventId, includePrivate);
      return NextResponse.json({ success: true, data: media }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }

  static async deleteMedia(req: NextRequest, mediaId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const media = await MediaService.getMediaById(mediaId);
      if (!media) {
        return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
      }

      const isUploader = media.uploadedBy.toString() === user.id;
      const isAdmin = user.role.toLowerCase() === 'admin';
      
      // Club Members and Photographers can delete their own uploaded images. Admins can delete any image.
      if (!isAdmin && !isUploader) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      if (media.s3Key) {
        try {
          await S3Service.deleteFile(media.s3Key);
        } catch (s3Error) {
          console.error(`Failed to delete file from S3: ${media.s3Key}`, s3Error);
          // Continue to delete the record even if S3 delete fails (e.g., file already deleted from S3)
        }
      }

      await MediaService.deleteMediaRecord(mediaId);

      return NextResponse.json({ success: true, message: 'Media deleted successfully' }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }
}
