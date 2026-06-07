import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import { LikeService } from '@/services/like.service';
import { NotificationService } from '@/services/notification.service';
import Media from '@/models/Media';
import Favourite from '@/models/Favourite';

export class LikeController {
  static async toggleLike(req: NextRequest, mediaId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const media = await Media.findById(mediaId).lean();
      if (!media) {
        return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
      }

      const { liked, likeCount } = await LikeService.toggleLike(mediaId, user.id);

      const ownerId = (media.uploadedBy as { toString(): string }).toString();
      if (liked && ownerId !== user.id) {
        await NotificationService.createNotification({
          recipientId: ownerId,
          actorId: user.id,
          type: 'like',
          mediaId,
        });
      }

      return NextResponse.json({ success: true, data: { liked, likeCount } }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: 500 }
      );
    }
  }

  static async getMediaStats(req: NextRequest, mediaId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      const media = await Media.findById(mediaId).lean();
      if (!media) {
        return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
      }

      const [likeCount, isLikedByUser, favourite] = await Promise.all([
        LikeService.getLikeCount(mediaId),
        user ? LikeService.isLikedByUser(mediaId, user.id) : Promise.resolve(false),
        user ? Favourite.exists({ mediaId, userId: user.id }) : Promise.resolve(null),
      ]);

      return NextResponse.json(
        { success: true, data: { likeCount, isLikedByUser, isFavourited: !!favourite } },
        { status: 200 }
      );
    } catch (error: unknown) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: 500 }
      );
    }
  }
}
