import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import { CommentService } from '@/services/comment.service';
import { NotificationService } from '@/services/notification.service';
import Media from '@/models/Media';

function safeInt(value: string | null, fallback: number): number {
  const parsed = parseInt(value ?? '', 10);
  return isNaN(parsed) ? fallback : parsed;
}

export class CommentController {
  static async createComment(req: NextRequest, mediaId: string) {
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

      const body = await req.json();
      const text = typeof body?.text === 'string' ? body.text.trim() : '';

      if (!text) {
        return NextResponse.json({ success: false, error: 'Comment text is required' }, { status: 400 });
      }

      const comment = await CommentService.createComment(mediaId, user.id, text);

      const ownerId = (media.uploadedBy as { toString(): string }).toString();
      if (ownerId !== user.id) {
        await NotificationService.createNotification({
          recipientId: ownerId,
          actorId: user.id,
          type: 'comment',
          mediaId,
          commentId: (comment._id as { toString(): string }).toString(),
        });
      }

      return NextResponse.json({ success: true, data: comment }, { status: 201 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }

  static async getComments(req: NextRequest, mediaId: string) {
    try {
      await connectToDatabase();

      const mediaExists = await Media.exists({ _id: mediaId });
      if (!mediaExists) {
        return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
      }

      const { searchParams } = new URL(req.url);
      const limit = Math.min(safeInt(searchParams.get('limit'), 20), 100);
      const skip = Math.max(safeInt(searchParams.get('skip'), 0), 0);

      const result = await CommentService.getCommentsForMedia(mediaId, limit, skip);
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }

  static async deleteComment(req: NextRequest, commentId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      await CommentService.deleteComment(commentId, user.id);
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }
}
