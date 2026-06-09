import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    s3Key: { type: String, required: true },
  mimeType: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    accessType: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    tags: {
      type: [String],
      default: [],
    },
    detectedUsers: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    faceDescriptors: {
      type: [[Number]],
      default: [],
    },
    hash: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Media || mongoose.model('Media', MediaSchema);
