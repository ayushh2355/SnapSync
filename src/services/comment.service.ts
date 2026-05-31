import Comment from '@/models/Comment';

export class CommentService {
  static async createComment(mediaId: string, userId: string, text: string) {
    const comment = await Comment.create({ mediaId, userId, text });
    await comment.populate('userId', 'name email');
    return comment;
  }

  static async getCommentsForMedia(mediaId: string, limit: number = 20, skip: number = 0) {
    const comments = await Comment.find({ mediaId })
      .populate('userId', 'name email')
      .sort('-createdAt')
      .limit(limit)
      .skip(skip);

    const total = await Comment.countDocuments({ mediaId });
    return { comments, total };
  }

  static async deleteComment(commentId: string, userId: string) {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.userId.toString() !== userId) {
      throw new Error('Unauthorized to delete this comment');
    }

    await Comment.deleteOne({ _id: commentId });
    return { success: true };
  }

  static async getCommentCount(mediaId: string) {
    return await Comment.countDocuments({ mediaId });
  }
}
