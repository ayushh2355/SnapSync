import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import { processLocalUpload } from '@/lib/upload';
import { MediaService } from '@/services/media.service';

export class MediaController {
  static async uploadMedia(req: NextRequest) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);
      
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      // Next.js App Router native way to handle multipart/form-data
      const formData = await req.formData();
      
      const file = formData.get('file') as File | null;
      const eventId = formData.get('eventId') as string | null;
      const accessType = (formData.get('accessType') as 'public' | 'private') || 'public';
      const rawTags = formData.get('tags') as string | null;
      
      if (!file || !eventId) {
        return NextResponse.json({ success: false, error: 'File and eventId are required.' }, { status: 400 });
      }

      const tags = rawTags ? JSON.parse(rawTags) : [];

      // Pass file to our local upload handler for validation and storage
      const fileUrl = await processLocalUpload(file);
      const fileType = file.type.startsWith('image') ? 'image' : 'video';

      const mediaRecord = await MediaService.createMediaRecord({
        eventId,
        uploadedBy: user.id,
        fileUrl,
        fileType,
        accessType,
        tags,
      });

      return NextResponse.json({ success: true, data: mediaRecord }, { status: 201 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  }
}
