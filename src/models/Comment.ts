import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
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
    text: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
