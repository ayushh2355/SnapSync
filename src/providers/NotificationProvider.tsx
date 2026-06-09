'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { apiClient, getAuthToken } from '@/lib/apiClient';

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
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseFailedRef = useRef(false);

  // ─── Fetch notifications from REST API ────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      // BUG FIX #1: API returns { success, data: { notifications, total, unreadCount } }
      // Old code was reading response.notifications which was always undefined
      const response = await apiClient('/api/notifications?limit=20');
      setNotifications(response.data?.notifications ?? []);
      setUnreadCount(response.data?.unreadCount ?? 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  // ─── Start polling fallback ────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return; // already polling
    // Poll every 30s as a reliable fallback when SSE is unavailable
    pollIntervalRef.current = setInterval(() => {
      refresh();
    }, 30_000);
  }, [refresh]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // ─── Connect SSE stream ────────────────────────────────────────────────────
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) return; // already connected

    // BUG FIX #2: EventSource can't set Authorization headers.
    // Pass the JWT token as a URL query param so the server can auth the SSE connection.
    const token = getAuthToken();
    const url = token
      ? `/api/notifications/stream?token=${encodeURIComponent(token)}`
      : '/api/notifications/stream';

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      sseFailedRef.current = false;
      // SSE is working — stop polling since we'll get real-time pushes
      stopPolling();
    };

    es.onmessage = (event) => {
      // Ignore heartbeat comments (": heartbeat")
      if (!event.data || event.data.trim() === '') return;
      try {
        const incoming: Notification = JSON.parse(event.data);
        setNotifications((prev) => {
          // Deduplicate — don't add if already in list
          if (prev.some((n) => n._id === incoming._id)) return prev;
          return [incoming, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
      } catch {
        // ignore parse errors (heartbeats, etc.)
      }
    };

    es.onerror = () => {
      console.warn('[SSE] Connection lost — falling back to polling.');
      es.close();
      eventSourceRef.current = null;
      sseFailedRef.current = true;
      // BUG FIX #3: When SSE fails, start polling so notifications still arrive
      startPolling();
      // Try to reconnect SSE after 10 seconds
      setTimeout(() => {
        if (sseFailedRef.current) {
          connectSSE();
        }
      }, 10_000);
    };
  }, [startPolling, stopPolling]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clean up on logout
      setNotifications([]);
      setUnreadCount(0);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      stopPolling();
      return;
    }

    // Initial fetch immediately
    refresh();

    // Connect real-time SSE
    connectSSE();

    // Also start polling as insurance (SSE will stop it once connected)
    startPolling();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      stopPolling();
    };
  }, [isAuthenticated, refresh, connectSSE, startPolling, stopPolling]);

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
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, refresh }}>
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
