import RoleRequest from '@/models/RoleRequest';
import User from '@/models/User';

import { NotificationService } from '@/services/notification.service';

export class RoleRequestService {
  static async getPendingRequests() {
    return RoleRequest.find({ status: 'pending' })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .lean();
  }

  static async updateRequestStatus(requestId: string, status: 'approved' | 'rejected', adminId: string) {
    const request = await RoleRequest.findById(requestId);
    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request already processed');
    }

    request.status = status;
    await request.save();

    if (status === 'approved') {
      await User.findByIdAndUpdate(request.userId, { role: request.requestedRole });
    }

    await NotificationService.createNotification({
      recipientId: (request.userId as { toString(): string }).toString(),
      actorId: adminId,
      type: status === 'approved' ? 'role_approved' : 'role_rejected',
      requestId: request._id.toString(),
    });

    return request;
  }
}
