import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import { S3Service } from '@/services/s3.service';
import { MediaService } from '@/services/media.service';

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

      const tags = rawTags ? JSON.parse(rawTags) : [];
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to S3
      const { url, key } = await S3Service.uploadFile(buffer, file.type, file.name);

      try {
        const fileType = file.type.startsWith('image') ? 'image' : 'video';
        const mediaRecord = await MediaService.createMediaRecord({
          eventId,
          uploadedBy: user.id,
          fileUrl: url,
          fileType,
          accessType,
          tags,
        });

        return NextResponse.json({ success: true, data: mediaRecord }, { status: 201 });
      } catch (dbError: unknown) {
        // Rollback S3 upload if DB save fails
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

      let includePrivate = false;
      if (user && ['Admin', 'Photographer', 'Club Member'].includes(user.role)) {
        includePrivate = true;
      }

      const media = await MediaService.getMediaForEvent(eventId, includePrivate);
      return NextResponse.json({ success: true, data: media }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  }
}
