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
        className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0f172a] border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-slate-900/50">
            <h3 className="font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Check size={14} /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                You have no notifications.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b border-gray-800 hover:bg-slate-800/50 transition-colors cursor-pointer ${notif.isRead ? 'opacity-70' : 'bg-slate-800/30'}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {notif.type === 'like' ? (
                        <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center text-xs font-bold">♥</div>
                      ) : notif.type === 'tag' ? (
                        <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs font-bold">@</div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">💬</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold text-white">{notif.actorId?.name || 'Someone'}</span>{' '}
                        {notif.type === 'like' ? 'liked your photo.' : notif.type === 'tag' ? 'tagged you in a photo!' : 'commented on your photo.'}
                      </p>
                      <span className="text-xs text-gray-500 mt-1 block">
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
