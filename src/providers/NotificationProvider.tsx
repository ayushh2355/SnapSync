'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { apiClient } from '@/lib/apiClient';

export interface Notification {
  _id: string;
  type: string;
  actorId: { _id: string; name: string };
  isRead: boolean;
  createdAt: string;
  mediaId?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    apiClient('/api/notifications?limit=20')
      .then((response) => {
        setNotifications(response.notifications ?? []);
        setUnreadCount(response.unreadCount ?? 0);
      })
      .catch((err) => console.error('Failed to fetch notifications:', err));

    const es = new EventSource('/api/notifications/stream');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const incoming: Notification = JSON.parse(event.data);
        setNotifications((prev) => [incoming, ...prev]);
        setUnreadCount((prev) => prev + 1);
      } catch {
        console.error('Failed to parse SSE payload');
      }
    };

    es.onerror = () => {
      console.error('SSE connection lost');
      es.close();
      eventSourceRef.current = null;
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [isAuthenticated]);

  const markAsRead = async (id: string) => {
    try {
      await apiClient(`/api/notifications/${id}`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
