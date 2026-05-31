import Notification from '@/models/Notification';
import Media from '@/models/Media';
import User from '@/models/User';

interface RealTimeNotificationEvent {
  type: 'like' | 'comment';
  recipientId: string;
  actorId: string;
  mediaId: string;
  commentId?: string;
}

const notificationSubscribers: Map<string, Set<(event: RealTimeNotificationEvent) => void>> = new Map();

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

    this.emitRealTimeNotification({
      type: data.type,
      recipientId: data.recipientId,
      actorId: data.actorId,
      mediaId: data.mediaId,
      commentId: data.commentId,
    });

    return notification;
  }

  static async getNotifications(userId: string, limit: number = 20, skip: number = 0) {
    const notifications = await Notification.find({ recipientId: userId })
      .populate('actorId', 'name email')
      .populate('mediaId')
      .sort('-createdAt')
      .limit(limit)
      .skip(skip);

    const total = await Notification.countDocuments({ recipientId: userId });
    const unreadCount = await Notification.countDocuments({ recipientId: userId, isRead: false });

    return { notifications, total, unreadCount };
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.recipientId.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    notification.isRead = true;
    await notification.save();

    return notification;
  }

  static async markAllAsRead(userId: string) {
    await Notification.updateMany({ recipientId: userId }, { isRead: true });
    return { success: true };
  }

  static subscribe(userId: string, callback: (event: RealTimeNotificationEvent) => void) {
    if (!notificationSubscribers.has(userId)) {
      notificationSubscribers.set(userId, new Set());
    }
    notificationSubscribers.get(userId)!.add(callback);

    return () => {
      notificationSubscribers.get(userId)?.delete(callback);
      if (notificationSubscribers.get(userId)?.size === 0) {
        notificationSubscribers.delete(userId);
      }
    };
  }

  private static emitRealTimeNotification(event: RealTimeNotificationEvent) {
    const callbacks = notificationSubscribers.get(event.recipientId);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  static getActiveSubscribers(userId: string): number {
    return notificationSubscribers.get(userId)?.size || 0;
  }
}
