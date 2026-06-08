import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an event name'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide an event date'],
    },
    category: {
      type: String,
      required: [true, 'Please provide an event category'],
    },
    description: {
      type: String,
      required: [true, 'Please provide an event description'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
