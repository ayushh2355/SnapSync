import mongoose from 'mongoose';

const LikeSchema = new mongoose.Schema(
  {
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

LikeSchema.index({ mediaId: 1, userId: 1 }, { unique: true });

export default mongoose.models.Like || mongoose.model('Like', LikeSchema);
