import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import Media from '@/models/Media';
import { S3Service } from '@/services/s3.service';
import { WatermarkService } from '@/services/watermark.service';

const FILE_TYPE_META: Record<string, { contentType: string; ext: string }> = {
  'image/jpeg': { contentType: 'image/jpeg', ext: 'jpg' },
  'image/png': { contentType: 'image/png', ext: 'png' },
  'image/webp': { contentType: 'image/webp', ext: 'webp' },
  'video/mp4': { contentType: 'video/mp4', ext: 'mp4' },
  'video/webm': { contentType: 'video/webm', ext: 'webm' },
};

const PRIVILEGED_ROLES = new Set(['Admin', 'Photographer', 'Club Member']);

export class DownloadController {
  static async downloadMedia(req: NextRequest, mediaId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      const media = await Media.findById(mediaId).populate('eventId', 'name').lean();
      if (!media) {
        return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
      }

      if (media.accessType === 'private') {
        if (!user) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const ownerId = (media.uploadedBy as { toString(): string }).toString();
        if (ownerId !== user.id && !PRIVILEGED_ROLES.has(user.role)) {
          return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
      }

      if (!media.s3Key) {
        return NextResponse.json({ success: false, error: 'Media storage key missing' }, { status: 500 });
      }

      const buffer = await S3Service.getFileBuffer(media.s3Key as string);
      const isImage = media.fileType === 'image';

      let finalBuffer = buffer;
      if (isImage) {
        const eventName = (media.eventId as unknown as { name?: string })?.name ?? 'SnapSync';
        finalBuffer = await WatermarkService.applyWatermark(buffer, eventName);
      }

      const mimeType = media.mimeType as string | undefined;
      const meta = (mimeType ? FILE_TYPE_META[mimeType] : undefined) ?? (isImage
        ? FILE_TYPE_META['image/jpeg']
        : FILE_TYPE_META['video/mp4']);

      const headers = new Headers();
      headers.set('Content-Type', meta.contentType);
      headers.set('Content-Disposition', `attachment; filename="download_${mediaId}.${meta.ext}"`);

      return new NextResponse(finalBuffer as unknown as BodyInit, { status: 200, headers });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }
}
