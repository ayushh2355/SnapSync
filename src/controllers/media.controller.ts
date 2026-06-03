import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import { S3Service } from '@/services/s3.service';
import { MediaService } from '@/services/media.service';
import { VisionService } from '@/services/vision.service';
import { FaceService } from '@/services/face.service';
import { SharingService } from '@/services/sharing.service';
import crypto from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];

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
      const accessType = (formData.get('accessType') as 'public' | 'private') || 'public';
      const rawTags = formData.get('tags') as string | null;
      
      if (!file || !eventId) {
        return NextResponse.json({ success: false, error: 'File and eventId are required.' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: 'File exceeds 10MB limit.' }, { status: 400 });
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json({ success: false, error: 'Invalid file type.' }, { status: 400 });
      }

      const initialTags = rawTags ? JSON.parse(rawTags) : [];
      const buffer = Buffer.from(await file.arrayBuffer());
      
      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
      const isDuplicate = await MediaService.checkDuplicate(eventId, fileHash);
      if (isDuplicate) {
        return NextResponse.json({ success: false, error: 'Duplicate media detected for this event.' }, { status: 409 });
      }

      const fileType = file.type.startsWith('image') ? 'image' : 'video';
      
      let finalTags = [...initialTags];
      let detectedUsers: string[] = [];

      if (fileType === 'image') {
        const aiTags = await VisionService.generateTags(buffer);
        finalTags = Array.from(new Set([...finalTags, ...aiTags]));
        
        const faceMetadata = await FaceService.detectFaces(buffer);
        detectedUsers = await FaceService.findMatchingUsers(faceMetadata);
      }

      const { url, key } = await S3Service.uploadFile(buffer, file.type, file.name);

      try {
        const mediaRecord = await MediaService.createMediaRecord({
          eventId,
          uploadedBy: user.id,
          fileUrl: url,
          fileType,
          accessType,
          tags: finalTags,
          detectedUsers,
          hash: fileHash,
        });

        return NextResponse.json({ success: true, data: mediaRecord }, { status: 201 });
      } catch (dbError: unknown) {
       
        await S3Service.deleteFile(key).catch(console.error);
        throw dbError;
      }
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  }

  static async getEventMedia(req: NextRequest, eventId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);
      
      const { searchParams } = new URL(req.url);
      const token = searchParams.get('shareToken');
      
      let includePrivate = false;

      if (token) {
        const decodedEventId = SharingService.verifyShareToken(token);
        if (decodedEventId === eventId) {
          includePrivate = true;
        }
      }

      if (!includePrivate && user && ['Admin', 'Photographer', 'Club Member'].includes(user.role)) {
        includePrivate = true;
      }

      const media = await MediaService.getMediaForEvent(eventId, includePrivate);
      return NextResponse.json({ success: true, data: media }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  }
}
