import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    url: {
      type: String,
      required: [true, 'Please provide a media URL'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, 
      default: {},
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Media || mongoose.model('Media', MediaSchema);
