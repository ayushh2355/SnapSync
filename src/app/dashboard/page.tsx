'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/providers/AuthProvider';
import { Plus, Home, Calendar, Image as ImageIcon, Search, Lock, Tag, ArrowUpDown } from 'lucide-react';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';

interface Event {
  _id: string;
  name: string;
  description?: string;
  date: string;
  category: string;
  createdBy?: string;
  isPrivate?: boolean;
  coverImage?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [sortBy, setSortBy] = useState('Date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const canCreateEvent = user?.role === 'Admin' || user?.role === 'Photographer';

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
      <div className="min-h-screen flex flex-col items-center justify-center relative z-10">
        <div className="w-12 h-12 rounded-full border-4 border-fuchsia-500/30 dark:border-white/10 border-t-fuchsia-500 dark:border-t-white/80 animate-spin mb-4"></div>
        <p className="text-slate-500 dark:text-[#9ca3af] font-medium tracking-wide animate-pulse">Loading Workspace...</p>
      </div>
    );
  }

  let filteredEvents = events.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || (e.category && e.category.toLowerCase().includes(searchQuery.toLowerCase())));

  if (categoryFilter !== 'All Categories') {
    filteredEvents = filteredEvents.filter(e => e.category === categoryFilter);
  }

  filteredEvents.sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'Date') {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      comparison = a.name.localeCompare(b.name);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Helper function to pick a gradient based on the event ID
  const getGradient = (id: string) => {
    const gradients = [
      'from-purple-200 via-pink-200 to-rose-200',
      'from-violet-200 to-fuchsia-200',
      'from-sky-200 to-indigo-200',
      'from-fuchsia-200 to-pink-200',
      'from-rose-200 to-orange-100',
    ];
    // Simple hash
    const sum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[sum % gradients.length];
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-50 font-sans selection:bg-fuchsia-500/30 pb-20 relative z-10">
      {/* Navigation */}
      <header className="w-full bg-white/40 backdrop-blur-md border-b border-fuchsia-200/50 dark:border-white/10 sticky top-0 z-30">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
            <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-rose-500/10 to-rose-500/5 flex items-center justify-center font-bold text-2xl text-rose-600 shadow-[0_10px_30px_rgba(244,63,94,0.2)] border border-rose-400/30 group-hover:shadow-[0_10px_40px_rgba(244,63,94,0.3)] group-hover:border-rose-400/50 transition-all">
              S
            </div>
            <span className="font-extrabold text-2xl tracking-tight hidden sm:block bg-gradient-to-r from-rose-600 via-rose-900 to-slate-900 text-transparent bg-clip-text group-hover:from-rose-500 group-hover:via-rose-800 group-hover:to-slate-800 transition-all">SnapSync</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <NotificationBell />
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2 text-slate-900">Club Events & Albums</h1>
            <p className="text-lg text-slate-500 max-w-xl">Browse through public and private event media galleries.</p>
          </div>
          
          {canCreateEvent && (
            <Button onClick={() => router.push('/events/new')} className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-600/80 via-purple-600/80 to-fuchsia-600/80 hover:from-fuchsia-500/90 hover:via-purple-500/90 hover:to-fuchsia-500/90 text-white shadow-[0_15px_35px_rgba(217,70,239,0.3)] backdrop-blur-sm border border-fuchsia-400/30 hover:border-fuchsia-300/40 rounded-full px-6 py-3 transition duration-200">
              <Plus size={18} />
              <span className="font-medium">Create Event</span>
            </Button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-white/40 bg-gradient-to-r from-fuchsia-500/5 via-fuchsia-500/5 to-transparent backdrop-blur-md border border-fuchsia-400/30 rounded-[20px] p-4 mb-8 shadow-[0_15px_40px_rgba(217,70,239,0.1)] hover:shadow-[0_0_60px_rgba(217,70,239,0.3)] hover:border-fuchsia-500/50 transition-all duration-500">
          {/* Left Side: Category Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto mb-4 md:mb-0">
            <span className="text-slate-600 font-medium text-sm flex items-center gap-1.5"><Tag size={16} /> Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white/60 border border-slate-200/80 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 appearance-none shadow-sm min-w-[160px] cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
            >
              <option value="All Categories">All Categories</option>
              <option value="Photography">Photography</option>
              <option value="Workshop">Workshop</option>
              <option value="Competition">Competition</option>
              <option value="Concert">Concert</option>
              <option value="Cultural Fest">Cultural Fest</option>
              <option value="Party">Party</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Right Side: Sort & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-48">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/60 border border-slate-200/80 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 text-slate-900 placeholder-slate-400 shadow-sm"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span className="text-slate-600 font-medium text-sm hidden sm:block">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/60 border border-slate-200/80 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 appearance-none shadow-sm min-w-[120px] cursor-pointer"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
              >
                <option value="Date">Date</option>
                <option value="Name">Name</option>
              </select>
              <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-2 bg-white/60 border border-slate-200/80 rounded-xl hover:bg-white/80 transition-colors shadow-sm text-slate-600 hover:text-slate-900 flex-shrink-0">
                <ArrowUpDown size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/10 via-fuchsia-500/5 to-transparent backdrop-blur-md shadow-[0_30px_80px_rgba(217,70,239,0.15)] hover:shadow-[0_0_100px_rgba(217,70,239,0.4)] hover:border-fuchsia-500/60 p-6 sm:p-8 min-h-[400px] transition-all duration-500 bg-white/40">
        {error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-medium mb-8">
            <p>Error loading events: {error}</p>
          </div>
        ) : events.length === 0 ? (
          /* Premium Empty State */
          <div className="mt-12 flex flex-col items-center justify-center text-center p-12 rounded-[28px] border border-dashed border-fuchsia-300/50 bg-white/30 backdrop-blur-sm shadow-[0_15px_35px_rgba(217,70,239,0.05)]">
            <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-fuchsia-500/10 to-blue-500/10 dark:from-white/5 dark:to-white/5 flex items-center justify-center border border-fuchsia-100 dark:border-white/10">
              <ImageIcon className="w-10 h-10 text-fuchsia-500 dark:text-white/40 opacity-80" />
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-slate-900 dark:text-white">No events yet</h2>
            <p className="text-slate-500 dark:text-[#9ca3af] max-w-md mb-8">
              {canCreateEvent 
                ? "You haven't created or joined any events. Create your first event to start organizing and tagging photos!"
                : "There are no events available for you to view yet."}
            </p>
            {canCreateEvent && (
              <Button onClick={() => router.push('/events/new')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 dark:bg-white/10 dark:hover:bg-white/20 shadow-lg shadow-indigo-500/25 dark:shadow-none border dark:border-white/10 dark:text-white rounded-full px-8 py-4 text-lg">
                <Plus size={20} />
                <span className="font-medium">Create Your First Event</span>
              </Button>
            )}
          </div>
        ) : (
          /* Events Grid Rendering */
          renderGrids()
        )}
        </div>
      </main>
    </div>
  );

  function renderGrids() {
    const myEvents = filteredEvents.filter(e => e.createdBy === user?.id);
    const allEventsToDisplay = filteredEvents;

    const EventCard = ({ event }: { event: Event }) => (
      <div 
        key={event._id} 
        onClick={() => router.push(`/events/${event._id}`)} 
        className="group relative flex flex-col bg-white/50 backdrop-blur-md border border-white/40 rounded-2xl overflow-hidden hover:border-fuchsia-300 hover:bg-white/70 transition-all duration-500 cursor-pointer shadow-[0_15px_35px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(217,70,239,0.15)] hover:scale-[1.02] h-[320px]"
      >
        <div className={`h-48 w-full relative overflow-hidden shrink-0 ${!event.coverImage ? `bg-gradient-to-br ${getGradient(event._id)}` : ''}`}>
          {event.coverImage ? (
            <>
              <img src={event.coverImage} alt={event.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
            </>
          ) : (
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,rgba(0,0,0,1)_1px,transparent_0)] bg-[size:16px_16px]"></div>
          )}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {event.isPrivate && (
              <div className="bg-white/30 backdrop-blur-sm border border-white/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Lock size={12} className="text-slate-800" />
                <span className="text-xs font-semibold text-slate-800">Private</span>
              </div>
            )}
            <div className="bg-white/30 backdrop-blur-sm border border-white/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.8)] animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-800">{event.category}</span>
            </div>
          </div>
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-fuchsia-600 dark:group-hover:text-white/80 transition-colors line-clamp-1">{event.name}</h2>
          <div className="flex items-center text-xs text-slate-500 dark:text-[#9ca3af] mb-4 font-medium">
            <Calendar size={14} className="mr-1.5 opacity-70" />
            {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10 mt-auto">
            <div className="text-sm font-medium text-fuchsia-600 dark:text-white/70 group-hover:text-fuchsia-500 dark:group-hover:text-white transition-colors flex items-center gap-1">
              Open Gallery
              <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform inline-block">&rarr;</span>
            </div>
          </div>
        </div>
      </div>
    );

    const MobileCreateCard = () => (
      <div 
        onClick={() => router.push('/events/new')}
        className="sm:hidden flex flex-col items-center justify-center h-[320px] rounded-[24px] border-2 border-dashed border-fuchsia-300/50 bg-white/40 hover:bg-white/60 backdrop-blur-md hover:border-fuchsia-400 transition-all cursor-pointer group shadow-sm"
      >
        <div className="w-12 h-12 rounded-full bg-fuchsia-500/10 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border dark:border-white/10">
          <Plus className="text-fuchsia-600 dark:text-white/70 w-6 h-6" />
        </div>
        <span className="text-slate-600 dark:text-[#9ca3af] font-medium group-hover:text-fuchsia-600 dark:group-hover:text-white transition-colors">Create New Event</span>
      </div>
    );

    if (!canCreateEvent) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEvents.map(event => <EventCard key={event._id} event={event} />)}
        </div>
      );
    }

    return (
      <div className="space-y-12">
        {myEvents.length > 0 && (
          <div>
            <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 tracking-tight mb-8">Your Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <MobileCreateCard />
              {myEvents.map(event => <EventCard key={event._id} event={event} />)}
            </div>
          </div>
        )}
        
        {allEventsToDisplay.length > 0 && (
          <div>
            <h2 className="text-2xl lg:text-3xl font-semibold text-slate-900 tracking-tight mb-8">All Events</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myEvents.length === 0 && <MobileCreateCard />}
              {allEventsToDisplay.map(event => <EventCard key={event._id} event={event} />)}
            </div>
          </div>
        )}
      </div>
    );
  }
}
