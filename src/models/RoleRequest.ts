import mongoose from 'mongoose';

const RoleRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedRole: {
      type: String,
      enum: ['Admin', 'Photographer', 'Club Member'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

RoleRequestSchema.index({ userId: 1, requestedRole: 1, status: 1 });

export default mongoose.models.RoleRequest || mongoose.model('RoleRequest', RoleRequestSchema);