import Notification from '@/models/Notification';

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

  static subscribe(userId: string, callback: EventCallback) {
    if (!subscribers.has(userId)) {
      subscribers.set(userId, new Set());
    }
    subscribers.get(userId)!.add(callback);

    return () => {
      subscribers.get(userId)?.delete(callback);
      if (subscribers.get(userId)?.size === 0) {
        subscribers.delete(userId);
      }
    };
  }

  private static emitToSubscribers(event: RealTimeEvent) {
    const callbacks = subscribers.get(event.recipientId);
    if (callbacks) {
      callbacks.forEach(cb => cb(event));
    }
  }
}
