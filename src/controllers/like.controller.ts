import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import { LikeService } from '@/services/like.service';
import { NotificationService } from '@/services/notification.service';
import Media from '@/models/Media';

export class LikeController {
  static async toggleLike(req: NextRequest, mediaId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const media = await Media.findById(mediaId);
      if (!media) {
        return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
      }

      const { liked, likeCount } = await LikeService.toggleLike(mediaId, user.id);

      if (liked) {
        await NotificationService.createNotification({
          recipientId: media.uploadedBy.toString(),
          actorId: user.id,
          type: 'like',
          mediaId,
        });
      }

      return NextResponse.json(
        { success: true, data: { liked, likeCount } },
        { status: 200 }
      );
    } catch (error: unknown) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: 400 }
      );
    }
  }

  static async getMediaStats(req: NextRequest, mediaId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      const media = await Media.findById(mediaId);
      if (!media) {
        return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
      }

      const likeCount = await LikeService.getLikeCount(mediaId);
      let isLikedByUser = false;

      if (user) {
        isLikedByUser = await LikeService.isLikedByUser(mediaId, user.id);
      }

      return NextResponse.json(
        { success: true, data: { likeCount, isLikedByUser } },
        { status: 200 }
      );
    } catch (error: unknown) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: 400 }
      );
    }
  }
}
