import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import Media from '@/models/Media';
import Like from '@/models/Like';
import mongoose from 'mongoose';

const PRIVILEGED_ROLES = new Set(['Admin', 'Photographer', 'Club Member']);

function safeInt(value: string | null, fallback: number): number {
  const parsed = parseInt(value ?? '', 10);
  return isNaN(parsed) ? fallback : parsed;
}

export class SearchController {
  static async searchMedia(req: NextRequest) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      const includePrivate = !!user && PRIVILEGED_ROLES.has(user.role);

      const { searchParams } = new URL(req.url);
      const tags = searchParams.getAll('tag');
      const eventId = searchParams.get('eventId');
      const uploadedBy = searchParams.get('uploadedBy');
      const detectedUserId = searchParams.get('detectedUserId');
      const limit = Math.min(safeInt(searchParams.get('limit'), 20), 100);
      const skip = Math.max(safeInt(searchParams.get('skip'), 0), 0);

      const query: Record<string, unknown> = {};

      if (!includePrivate) {
        query.accessType = 'public';
      }

      if (tags.length > 0) {
        query.tags = { $in: tags };
      }

      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        query.eventId = new mongoose.Types.ObjectId(eventId);
      }

      if (uploadedBy && mongoose.Types.ObjectId.isValid(uploadedBy)) {
        query.uploadedBy = new mongoose.Types.ObjectId(uploadedBy);
      }

      if (detectedUserId && mongoose.Types.ObjectId.isValid(detectedUserId)) {
        query.detectedUsers = new mongoose.Types.ObjectId(detectedUserId);
      }

      const [media, total] = await Promise.all([
        Media.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .populate('eventId', 'name')
          .populate('uploadedBy', 'name')
          .populate('detectedUsers', 'name')
          .lean(),
        Media.countDocuments(query),
      ]);

      const mediaIds = media.map((m) => m._id);
      const likeCounts = await Like.aggregate([
        { $match: { mediaId: { $in: mediaIds } } },
        { $group: { _id: '$mediaId', count: { $sum: 1 } } },
      ]);
      const likeCountMap: Record<string, number> = {};
      for (const item of likeCounts) {
        likeCountMap[item._id.toString()] = item.count;
      }

      const mediaWithLikes = media.map((m) => ({
        ...m,
        likesCount: likeCountMap[m._id.toString()] ?? 0,
      }));

      return NextResponse.json({ success: true, data: { media: mediaWithLikes, total } }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }
}
