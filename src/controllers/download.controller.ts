import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import Media from '@/models/Media';
import { S3Service } from '@/services/s3.service';
import { WatermarkService } from '@/services/watermark.service';

export class DownloadController {
  static async downloadMedia(req: NextRequest, mediaId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);
      const media = await Media.findById(mediaId).populate('eventId', 'name');

      if (!media) {
        return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
      }

      if (media.accessType === 'private' && !user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const fileUrl = media.fileUrl as string;
      let key = '';

      if (fileUrl.includes('.amazonaws.com/')) {
        const urlParts = fileUrl.split('.amazonaws.com/');
        if (urlParts.length !== 2) throw new Error('Invalid S3 URL format');
        key = urlParts[1];
      } else if (fileUrl.startsWith('/uploads/media/')) {
        key = fileUrl.replace('/uploads/', '');
      } else if (fileUrl.startsWith('/api/media/serve/')) {
        key = fileUrl.replace('/api/media/serve/', 'media/');
      } else {
        throw new Error('Unknown media URL format');
      }

      const buffer = await S3Service.getFileBuffer(key);

      let finalBuffer = buffer;
      if (media.fileType === 'image') {
        const watermarkText = (media.eventId as unknown as { name: string }).name || 'SnapSync';
        finalBuffer = await WatermarkService.applyWatermark(buffer, watermarkText);
      }

      const headers = new Headers();
      headers.set('Content-Type', media.fileType === 'image' ? 'image/jpeg' : 'video/mp4');
      headers.set('Content-Disposition', `attachment; filename="download_${mediaId}.${media.fileType === 'image' ? 'jpg' : 'mp4'}"`);

      return new NextResponse(finalBuffer as unknown as BodyInit, { status: 200, headers });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  }
}
