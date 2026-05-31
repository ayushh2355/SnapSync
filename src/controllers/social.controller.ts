import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import { SocialService } from '@/services/social.service';
import { NotificationService } from '@/services/notification.service';
import Media from '@/models/Media';

export class SocialController {
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

      const { liked, likeCount } = await SocialService.toggleLike(mediaId, user.id);

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

  static async createComment(req: NextRequest, mediaId: string) {
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

      const body = await req.json();
      const { text } = body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Comment text is required' },
          { status: 400 }
        );
      }

      const comment = await SocialService.createComment(mediaId, user.id, text.trim());

      await NotificationService.createNotification({
        recipientId: media.uploadedBy.toString(),
        actorId: user.id,
        type: 'comment',
        mediaId,
        commentId: comment._id.toString(),
      });

      return NextResponse.json(
        { success: true, data: comment },
        { status: 201 }
      );
    } catch (error: unknown) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: 400 }
      );
    }
  }

  static async getComments(req: NextRequest, mediaId: string) {
    try {
      await connectToDatabase();

      const { searchParams } = new URL(req.url);
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const skip = Math.max(parseInt(searchParams.get('skip') || '0'), 0);

      const media = await Media.findById(mediaId);
      if (!media) {
        return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
      }

      const result = await SocialService.getCommentsForMedia(mediaId, limit, skip);

      return NextResponse.json({ success: true, data: result }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: 400 }
      );
    }
  }

  static async deleteComment(req: NextRequest, commentId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      await SocialService.deleteComment(commentId, user.id);

      return NextResponse.json({ success: true }, { status: 200 });
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

      const likeCount = await SocialService.getLikeCount(mediaId);
      const commentCount = await SocialService.getCommentCount(mediaId);
      let isLikedByUser = false;

      if (user) {
        isLikedByUser = await SocialService.isLikedByUser(mediaId, user.id);
      }

      return NextResponse.json(
        {
          success: true,
          data: { likeCount, commentCount, isLikedByUser },
        },
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
