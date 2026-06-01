import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import Media from '@/models/Media';
import mongoose from 'mongoose';

export class SearchController {
  static async searchMedia(req: NextRequest) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      let includePrivate = false;
      if (user && ['Admin', 'Photographer', 'Club Member'].includes(user.role)) {
        includePrivate = true;
      }

      const { searchParams } = new URL(req.url);
      const tags = searchParams.getAll('tag');
      const eventId = searchParams.get('eventId');
      const uploadedBy = searchParams.get('uploadedBy');
      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const skip = Math.max(parseInt(searchParams.get('skip') || '0'), 0);

      const query: Record<string, unknown> = {};

      if (!includePrivate) {
        query.accessType = 'public';
      }

      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        query.eventId = new mongoose.Types.ObjectId(eventId);
      }

      if (uploadedBy && mongoose.Types.ObjectId.isValid(uploadedBy)) {
        query.uploadedBy = new mongoose.Types.ObjectId(uploadedBy);
      }

      const media = await Media.find(query)
        .sort('-createdAt')
        .limit(limit)
        .skip(skip)
        .populate('eventId', 'name')
        .populate('uploadedBy', 'name');

      const total = await Media.countDocuments(query);

      return NextResponse.json({ success: true, data: { media, total } }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  }
}
