import Notification from '@/models/Notification';
import '@/models/Media';

interface RealTimeEvent {
  type: 'like' | 'comment';
  recipientId: string;
  actorId: string;
  mediaId: string;
  commentId?: string;
}

type EventCallback = (event: RealTimeEvent) => void;

const subscribers: Map<string, Set<EventCallback>> = new Map();

export class NotificationService {
  static async createNotification(data: {
    recipientId: string;
    actorId: string;
    type: 'like' | 'comment';
    mediaId: string;
    commentId?: string;
  }) {
    if (data.recipientId === data.actorId) {
      return null;
    }

    const notification = await Notification.create(data);

    this.emitToSubscribers({
      type: data.type,
      recipientId: data.recipientId,
      actorId: data.actorId,
      mediaId: data.mediaId,
      commentId: data.commentId,
    });

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

  private static emitToSubscribers(event: RealTimeEvent) {
    subscribers.get(event.recipientId)?.forEach((cb) => cb(event));
  }
}
