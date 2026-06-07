import mongoose from 'mongoose';

const FavouriteSchema = new mongoose.Schema(
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

// Ensure a user can only favourite a specific media once
FavouriteSchema.index({ mediaId: 1, userId: 1 }, { unique: true });

export default mongoose.models.Favourite || mongoose.model('Favourite', FavouriteSchema);
