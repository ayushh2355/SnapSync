import mongoose from 'mongoose';
import Media from '@/models/Media';

export class AnalyticsService {
  static async getEventStats(eventId: string) {
    const eventObjectId = new mongoose.Types.ObjectId(eventId);

    const [mediaStats, topPhotographers] = await Promise.all([
      Media.aggregate([
        { $match: { eventId: eventObjectId } },
        {
          $lookup: {
            from: 'likes',
            localField: '_id',
            foreignField: 'mediaId',
            as: 'likes',
          },
        },
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'mediaId',
            as: 'comments',
          },
        },
        {
          $group: {
            _id: null,
            totalMedia: { $sum: 1 },
            totalLikes: { $sum: { $size: '$likes' } },
            totalComments: { $sum: { $size: '$comments' } },
          },
        },
        { $project: { _id: 0 } },
      ]),
      Media.aggregate([
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
      ]),
    ]);

    const stats = mediaStats[0] ?? { totalMedia: 0, totalLikes: 0, totalComments: 0 };

    return { ...stats, topPhotographers };
  }
}
