import mongoose from 'mongoose';
import Media from '@/models/Media';
import Like from '@/models/Like';
import Comment from '@/models/Comment';

export class AnalyticsService {
  static async getEventStats(eventId: string) {
    const eventObjectId = new mongoose.Types.ObjectId(eventId);

    const mediaList = await Media.find({ eventId: eventObjectId }).select('_id');
    const mediaIds = mediaList.map((m) => m._id);

    const totalMedia = mediaIds.length;

    const totalLikes = await Like.countDocuments({ mediaId: { $in: mediaIds } });

    const totalComments = await Comment.countDocuments({ mediaId: { $in: mediaIds } });

    const topPhotographers = await Media.aggregate([
      { $match: { eventId: eventObjectId } },
      { $group: { _id: '$uploadedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          count: 1,
        },
      },
    ]);

    return {
      totalMedia,
      totalLikes,
      totalComments,
      topPhotographers,
    };
  }
}
