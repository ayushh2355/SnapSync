'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNotifications, Notification } from '@/providers/NotificationProvider';

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-11 h-11 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-all shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:shadow-[0_0_25px_rgba(244,63,94,0.25)] border border-rose-500/10"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm border-[2px] border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 rounded-[28px] border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/10 via-fuchsia-500/5 to-transparent backdrop-blur-xl shadow-[0_30px_80px_rgba(217,70,239,0.15)] bg-white/40 overflow-hidden z-50">
          <div className="p-5 border-b border-fuchsia-400/20 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium"
              >
                <Check size={14} /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <Bell className="text-slate-400 w-10 h-10 mb-3 stroke-[1.5]" />
                <p className="text-slate-500 text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${notif.isRead ? 'opacity-70' : 'bg-slate-50 dark:bg-white/5'}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {notif.type === 'like' ? (
                        <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center text-xs font-bold">♥</div>
                      ) : notif.type === 'tag' ? (
                        <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs font-bold">@</div>
                      ) : notif.type === 'role_request' ? (
                        <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 text-fuchsia-500 flex items-center justify-center text-xs font-bold">🛡️</div>
                      ) : notif.type === 'role_approved' ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-xs font-bold">✓</div>
                      ) : notif.type === 'role_rejected' ? (
                        <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-xs font-bold">✕</div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">💬</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-slate-700 dark:text-gray-300">
                        <span className="font-semibold text-slate-900 dark:text-white">{notif.actorId?.name || 'Someone'}</span>{' '}
                        {notif.type === 'like' ? 'liked your photo.' : notif.type === 'tag' ? 'tagged you in a photo!' : notif.type === 'role_request' ? 'requested a role upgrade.' : notif.type === 'role_approved' ? 'approved your role upgrade!' : notif.type === 'role_rejected' ? 'rejected your role request.' : 'commented on your photo.'}
                      </p>
                      <span className="text-xs text-slate-500 dark:text-gray-500 mt-1 block">
                        {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
