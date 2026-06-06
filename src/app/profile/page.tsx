'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';

interface Event {
  _id: string;
  name: string;
  date: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      apiClient('/api/events')
        .then((res) => {
          if (res.success) {
            setEvents(res.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingEvents(false));
    }
  }, [isAuthenticated]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    'Admin': 'text-red-400 bg-red-500/20 border-red-500/30',
    'Photographer': 'text-fuchsia-400 bg-fuchsia-500/20 border-fuchsia-500/30',
    'Club Member': 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
    'Viewer': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
  };
  const badgeTheme = roleColors[user.role] || roleColors['Viewer'];

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col pt-20">
      <button 
        onClick={() => router.push('/dashboard')} 
        className="text-gray-400 hover:text-white text-sm mb-8 transition-colors self-start"
      >
        &larr; Back to Dashboard
      </button>

      <div className="bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
          <div className="w-32 h-32 rounded-full border-4 border-gray-800 flex items-center justify-center font-bold text-5xl text-yellow-500 bg-slate-800 shadow-xl">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-white tracking-tight">{user.name}</h1>
              <span className={`text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-full border ${badgeTheme}`}>
                {user.role}
              </span>
            </div>
            <p className="text-gray-400 text-lg mb-6">{user.email}</p>
            
            <div className="flex items-center gap-4">
              <Button onClick={() => logout()} variant="secondary" className="border-gray-700 hover:bg-gray-800 text-red-400 hover:text-red-300">
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 relative z-10">
          <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-2xl">
            <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Account Status</h3>
            <p className="text-2xl font-semibold text-white">Active</p>
            <p className="text-sm text-gray-500 mt-2">Fully verified user</p>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-2xl">
            <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Total Events</h3>
            <p className="text-2xl font-semibold text-white">
              {loadingEvents ? '...' : events.length}
            </p>
            <p className="text-sm text-gray-500 mt-2">Events you have access to</p>
          </div>
        </div>
      </div>
    </div>
  );
}
