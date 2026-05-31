import Like from '@/models/Like';

export class LikeService {
  static async toggleLike(mediaId: string, userId: string) {
    const existingLike = await Like.findOne({ mediaId, userId });

    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      const likeCount = await Like.countDocuments({ mediaId });
      return { liked: false, likeCount };
    }

    await Like.create({ mediaId, userId });
    const likeCount = await Like.countDocuments({ mediaId });
    return { liked: true, likeCount };
  }

  static async getLikeCount(mediaId: string) {
    return await Like.countDocuments({ mediaId });
  }

  static async isLikedByUser(mediaId: string, userId: string) {
    const like = await Like.findOne({ mediaId, userId });
    return !!like;
  }
}
