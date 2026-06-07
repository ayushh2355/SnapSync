import Comment from '@/models/Comment';

export class CommentService {
  static async createComment(mediaId: string, userId: string, text: string) {
    const comment = await Comment.create({ mediaId, userId, text });
    await comment.populate('userId', 'name email');
    return comment;
  }

  static async getCommentsForMedia(mediaId: string, limit = 20, skip = 0) {
    const [comments, total] = await Promise.all([
      Comment.find({ mediaId })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Comment.countDocuments({ mediaId }),
    ]);

    return { comments, total };
  }

  static async deleteComment(commentId: string, userId: string) {
    const comment = await Comment.findOneAndDelete({
      _id: commentId,
      userId,
    }).lean();

    if (!comment) {
      throw new Error('Comment not found or unauthorized');
    }

    return { success: true };
  }

  static async getCommentCount(mediaId: string): Promise<number> {
    return Comment.countDocuments({ mediaId });
  }
}
