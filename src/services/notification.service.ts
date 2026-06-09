import Notification from '@/models/Notification';
import '@/models/Media';

interface RealTimeEvent {
  _id?: string;
  type: string;
  recipientId: any;
  actorId: any;
  mediaId: any;
  commentId?: any;
  createdAt?: string;
  isRead?: boolean;
}

type EventCallback = (event: any) => void;

const subscribers: Map<string, Set<EventCallback>> = new Map();

export class NotificationService {
  static async createNotification(data: {
    recipientId: string;
    actorId: string;
    type: 'like' | 'comment' | 'tag' | 'role_request' | 'role_approved' | 'role_rejected';
    mediaId?: string;
    commentId?: string;
    requestId?: string;
  }) {
    if (data.recipientId === data.actorId) {
      return null;
    }

    const notification = await Notification.create(data);
    const populated = await Notification.findById(notification._id)
      .populate('actorId', 'name email')
      .populate('mediaId')
      .lean();

    if (populated) {
      this.emitToSubscribers(populated);
    }

    return notification;
  }

  static async getNotifications(userId: string, limit = 20, skip = 0) {
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipientId: userId })
        .populate('actorId', 'name email')
        .populate('mediaId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Notification.countDocuments({ recipientId: userId }),
      Notification.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    return { notifications, total, unreadCount };
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { isRead: true },
      { new: true }
    ).lean();

    if (!notification) {
      throw new Error('Notification not found or unauthorized');
    }

    return notification;
  }

  static async markAllAsRead(userId: string) {
    await Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true });
    return { success: true };
  }

  static subscribe(userId: string, callback: EventCallback) {
    if (!subscribers.has(userId)) {
      subscribers.set(userId, new Set());
    }
    subscribers.get(userId)!.add(callback);

    return () => {
      const userSubs = subscribers.get(userId);
      if (!userSubs) return;
      userSubs.delete(callback);
      if (userSubs.size === 0) {
        subscribers.delete(userId);
      }
    };
  }

  private static emitToSubscribers(event: any) {
    const recipientId = event.recipientId.toString();
    subscribers.get(recipientId)?.forEach((cb) => cb(event));
  }
}
