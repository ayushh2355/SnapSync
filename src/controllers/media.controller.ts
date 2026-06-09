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


  static async saveMedia(req: NextRequest) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const body = await req.json();
      const { eventId, accessType, fileUrl, s3Key, mimeType, fileType, faceDescriptors } = body;

      if (!fileUrl || !eventId) {
        return NextResponse.json({ success: false, error: 'FileUrl and eventId are required' }, { status: 400 });
      }

      let parsedDescriptors: number[][] = [];
      if (faceDescriptors) {
        parsedDescriptors = safeParseJSON<number[][]>(faceDescriptors, []);
      }

      let detectedUsers: string[] = [];
      let finalTags: string[] = [];

      if (fileType === 'image') {
        try {
          detectedUsers = await FaceService.matchFacesAgainstUsers(parsedDescriptors);
          finalTags = await VisionService.generateTagsFromUrl(fileUrl, mimeType);
        } catch (e) {
          console.error("Error processing AI tags/faces:", e);
        }
      }

      const mediaRecord = await MediaService.createMediaRecord({
        eventId,
        uploadedBy: user.id,
        fileUrl,
        s3Key,
        mimeType,
        fileType,
        accessType: accessType || 'public',
        tags: finalTags,
        detectedUsers,
        hash: s3Key,
      });

      for (const taggedUserId of detectedUsers) {
        if (taggedUserId.toString() !== user.id.toString()) {
          await NotificationService.createNotification({
            recipientId: taggedUserId,
            actorId: user.id,
            type: 'tag',
            mediaId: mediaRecord._id.toString(),
          });
        }
      }

      return NextResponse.json({ success: true, data: mediaRecord }, { status: 201 });

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
