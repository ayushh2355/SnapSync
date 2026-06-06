'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/providers/AuthProvider';
import { Plus, LogOut, Home } from 'lucide-react';

interface Event {
  _id: string;
  name: string;
  description?: string;
  date: string;
  category: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, logout, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/login');
      return;
    }

    const fetchEvents = async () => {
      try {
        const response = await apiClient('/api/events');
        setEvents(response.data || []);
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchEvents();
    }
  }, [isAuthenticated, authLoading, router]);

  if (isLoading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Dashboard</h1>
          <p className="text-gray-400">Manage and view your events.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push('/')} variant="secondary" className="flex items-center gap-2 bg-transparent border border-gray-700 hover:bg-gray-800">
            <Home size={18} />
            Home
          </Button>
          <Button onClick={() => router.push('/events/new')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus size={18} />
            Add Event
          </Button>
          <Button onClick={logout} variant="secondary" className="flex items-center gap-2">
            <LogOut size={18} />
            Sign Out
          </Button>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-md text-red-500">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-gray-400 text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
          No events found. You are not part of any active events.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event._id} onClick={() => router.push(`/events/${event._id}`)} className="p-6 flex flex-col h-full">
              <h2 className="text-xl font-semibold text-white mb-2">{event.name}</h2>
              <div className="text-xs text-blue-400 mb-4">{new Date(event.date).toLocaleDateString()} &bull; {event.category}</div>
              <p className="text-gray-400 text-sm grow line-clamp-3 mb-4">
                {event.description || 'No description provided.'}
              </p>
              <div className="mt-auto pt-4 border-t border-gray-800 text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors">
                View Gallery &rarr;
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
