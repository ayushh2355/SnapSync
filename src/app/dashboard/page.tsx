'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/providers/AuthProvider';
import { Plus, Home, Calendar, Image as ImageIcon, Search } from 'lucide-react';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium tracking-wide animate-pulse">Loading Workspace...</p>
      </div>
    );
  }

  const filteredEvents = events.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || (e.category && e.category.toLowerCase().includes(searchQuery.toLowerCase())));

  // Helper function to pick a gradient based on the event ID
  const getGradient = (id: string) => {
    const gradients = [
      'from-indigo-500 to-purple-500',
      'from-fuchsia-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-amber-500',
    ];
    // Simple hash
    const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[sum % gradients.length];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 pb-20">
      
      {/* Background ambient glow */}
      <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none z-0"></div>

      {/* Navigation */}
      <header className="relative z-20 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20">
            S
          </div>
          <span className="font-semibold text-2xl tracking-tight hidden sm:block">SnapSync</span>
        </div>

        <div className="flex items-center gap-6">
          <Button onClick={() => router.push('/')} variant="secondary" className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-full px-5">
            <Home size={18} />
            <span className="font-medium">Home</span>
          </Button>
          <NotificationBell />
          <ProfileDropdown />
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-8 mt-8">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">Your Events</h1>
            <p className="text-lg text-slate-400 max-w-xl">Manage galleries, control access, and browse photos for all your upcoming and past events.</p>
          </div>
          
          <div className="flex w-full md:w-auto items-center gap-4">
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-500" />
              </div>
              <input 
                type="text" 
                placeholder="Search events..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-white placeholder-slate-500"
              />
            </div>
            <Button onClick={() => router.push('/events/new')} className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 rounded-full px-6 py-2.5">
              <Plus size={18} />
              <span className="font-medium">New Event</span>
            </Button>
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-medium mb-8">
            <p>Error loading events: {error}</p>
          </div>
        ) : events.length === 0 ? (
          /* Premium Empty State */
          <div className="mt-20 flex flex-col items-center justify-center text-center p-12 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-xl">
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 flex items-center justify-center border border-white/10">
              <ImageIcon className="w-10 h-10 text-indigo-400 opacity-80" />
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-white">No events yet</h2>
            <p className="text-slate-400 max-w-md mb-8">You haven't created or joined any events. Create your first event to start organizing and tagging photos!</p>
            <Button onClick={() => router.push('/events/new')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 rounded-full px-8 py-4 text-lg">
              <Plus size={20} />
              <span className="font-medium">Create Your First Event</span>
            </Button>
          </div>
        ) : (
          /* Events Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Mobile Create Button - Only shows on mobile in the grid */}
            <div 
              onClick={() => router.push('/events/new')}
              className="sm:hidden flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/50 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Plus className="text-indigo-400 w-6 h-6" />
              </div>
              <span className="text-slate-300 font-medium group-hover:text-indigo-300 transition-colors">Create New Event</span>
            </div>

            {filteredEvents.map((event) => (
              <div 
                key={event._id} 
                onClick={() => router.push(`/events/${event._id}`)} 
                className="group relative flex flex-col bg-slate-900 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
              >
                {/* Image Placeholder / Banner */}
                <div className={`h-32 w-full bg-gradient-to-br ${getGradient(event._id)} relative overflow-hidden`}>
                  {/* Subtle overlay pattern */}
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:16px_16px]"></div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse"></span>
                    <span className="text-xs font-medium text-white/90">{event.category}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h2 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-1">{event.name}</h2>
                  
                  <div className="flex items-center text-xs text-slate-400 mb-4 font-medium">
                    <Calendar size={14} className="mr-1.5 opacity-70" />
                    {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-6 flex-1">
                    {event.description || 'No detailed description available for this event.'}
                  </p>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="text-sm font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                      Open Gallery
                      <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform inline-block">&rarr;</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
