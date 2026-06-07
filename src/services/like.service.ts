import Like from '@/models/Like';

export class LikeService {
  static async toggleLike(mediaId: string, userId: string) {
    const deleted = await Like.findOneAndDelete({ mediaId, userId }).lean();

    if (deleted) {
      const likeCount = await Like.countDocuments({ mediaId });
      return { liked: false, likeCount };
    }

    await Like.create({ mediaId, userId });
    const likeCount = await Like.countDocuments({ mediaId });
    return { liked: true, likeCount };
  }

  static async getLikeCount(mediaId: string): Promise<number> {
    return Like.countDocuments({ mediaId });
  }

  static async isLikedByUser(mediaId: string, userId: string): Promise<boolean> {
    return !!(await Like.exists({ mediaId, userId }));
  }
}
