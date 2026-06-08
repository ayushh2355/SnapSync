import mongoose from 'mongoose';

const UserReferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    selfieUrl: {
      type: String,
      required: true,
    },
    selfieKey: {
      type: String,
      required: true,
    },
    faceMetadata: {
      type: [Number],
      required: true,
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.UserReference || mongoose.model('UserReference', UserReferenceSchema);
