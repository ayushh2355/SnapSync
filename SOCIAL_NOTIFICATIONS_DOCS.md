Social Interactions & Notifications Module
==========================================

MODELS
------

Like.ts - Stores user likes on media items
- mediaId: Reference to Media
- userId: Reference to User
- Unique index on (mediaId, userId) to prevent duplicate likes

Comment.ts - Stores user comments on media items
- mediaId: Reference to Media
- userId: Reference to User
- text: Comment content (1-500 chars)

Notification.ts - Stores notifications for user interactions
- recipientId: User who receives the notification
- actorId: User who triggered the notification
- type: 'like' or 'comment'
- mediaId: Reference to Media
- commentId: Optional reference to Comment
- isRead: Track read status


API ENDPOINTS
-------------

LIKES & COMMENTS
POST /api/social/like/[mediaId]
  Toggle like on a media item
  Auth: Required
  Response: { liked: boolean, likeCount: number }

POST /api/social/comments/[mediaId]
  Create a comment on media
  Auth: Required
  Body: { text: string }
  Response: Comment object

GET /api/social/comments/[mediaId]
  Fetch comments for media (paginated)
  Query: limit, skip
  Response: { comments: [], total: number }

DELETE /api/social/comments/delete/[commentId]
  Delete a comment (only own comments)
  Auth: Required
  Response: { success: true }

GET /api/social/stats/[mediaId]
  Get like/comment counts and user's like status
  Response: { likeCount: number, commentCount: number, isLikedByUser: boolean }


NOTIFICATIONS
GET /api/notifications
  Fetch user's notifications (paginated)
  Auth: Required
  Query: limit, skip
  Response: { notifications: [], total: number, unreadCount: number }

PATCH /api/notifications/[id]
  Mark specific notification as read
  Auth: Required
  Response: Notification object

PATCH /api/notifications/read-all
  Mark all notifications as read
  Auth: Required
  Response: { success: true }

GET /api/notifications/stream
  Server-Sent Events stream for real-time notifications
  Auth: Required
  Returns: Event stream with notification events


SERVICES
--------

SocialService
- toggleLike(mediaId, userId): Toggle like, return count
- createComment(mediaId, userId, text): Create comment
- getCommentsForMedia(mediaId, limit, skip): Paginated comments
- deleteComment(commentId, userId): Delete comment
- getLikeCount(mediaId): Get total likes
- getCommentCount(mediaId): Get total comments
- isLikedByUser(mediaId, userId): Check if user liked media

NotificationService
- createNotification(data): Save notification and emit real-time event
- getNotifications(userId, limit, skip): Paginated notifications
- markAsRead(notificationId, userId): Mark single notification as read
- markAllAsRead(userId): Mark all notifications as read
- subscribe(userId, callback): Subscribe to real-time events
- emitRealTimeNotification(event): Emit event to subscribers


REAL-TIME NOTIFICATIONS
-----------------------

The NotificationService uses an in-memory subscriber map for real-time events.
The /api/notifications/stream endpoint provides Server-Sent Events (SSE) support.

For persistent real-time communication in production, consider:
- WebSocket library (socket.io, ws)
- Message queue (Redis, RabbitMQ)
- Pusher or similar service

Current implementation suitable for:
- Development and testing
- Single-instance deployments
- Non-critical notifications


NOTIFICATION FLOW
-----------------

1. User likes media or comments
2. Controller calls SocialService to perform action
3. If successful, NotificationService.createNotification is called
4. Notification saved to database
5. Real-time event emitted to subscribed recipients
6. Clients receive notification via SSE or polling
