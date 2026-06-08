'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import { Camera, Activity, Image as ImageIcon, Heart, Users, FolderOpen, ArrowLeft } from 'lucide-react';

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
  
  const [stats, setStats] = useState({
    totalUploads: 0,
    eventsContributedTo: 0,
    totalLikesReceived: 0,
  });

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Fetch accessible events
      apiClient('/api/events')
        .then((res) => {
          if (res.success) {
            setEvents(res.data);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingEvents(false));

      // Fetch user's uploaded media to calculate stats
      apiClient(`/api/media/search?uploadedBy=${user.id}&limit=100`)
        .then((res) => {
          if (res.success) {
            const media = res.data.media || [];
            // Calculate unique events contributed to
            const uniqueEvents = new Set(media.map((m: any) => m.eventId?._id || m.eventId));
            // Calculate total likes received on own uploads
            const likes = media.reduce((sum: number, m: any) => sum + (m.likesCount || 0), 0);
            
            setStats({
              totalUploads: res.data.total || 0,
              eventsContributedTo: uniqueEvents.size,
              totalLikesReceived: likes,
            });
          }
        })
        .catch(console.error);
    }
  }, [isAuthenticated, user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    'Admin': 'text-red-400 border-red-400/30',
    'Photographer': 'text-fuchsia-400 border-fuchsia-400/30',
    'Club Member': 'text-indigo-400 border-indigo-400/30',
    'Viewer': 'text-emerald-400 border-emerald-400/30',
  };
  const badgeTheme = roleColors[user.role] || roleColors['Viewer'];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-indigo-500/30 pb-20">
      
      {/* Top Header */}
      <div className="h-24 px-8 max-w-7xl mx-auto flex items-end pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">My Profile</h1>
          <p className="text-sm text-slate-500">Manage user account credentials and view your activity statistics.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-8">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: User Card */}
          <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            
            <div className="w-32 h-32 rounded-full border border-slate-700 flex items-center justify-center font-bold text-5xl text-indigo-400 bg-slate-950 shadow-inner mb-6 relative z-10">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            
            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">{user.name}</h2>
            <p className="text-sm text-slate-500 mb-6">{user.email}</p>
            
            <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-8 bg-slate-950 ${badgeTheme}`}>
              <ShieldIcon role={user.role} />
              {user.role}
            </div>
            
            <button 
              onClick={() => logout()} 
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-all border border-slate-700"
            >
              Sign Out
            </button>
          </div>

          {/* Right Column: Stats & Features */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
            
            {/* Stats Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Activity size={20} className="text-indigo-400" />
                Activity Overview
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard 
                  icon={<ImageIcon size={18} className="text-blue-400" />}
                  label="Total Uploads"
                  value={stats.totalUploads.toString()}
                />
                <StatCard 
                  icon={<FolderOpen size={18} className="text-emerald-400" />}
                  label="Albums Contributed"
                  value={stats.eventsContributedTo.toString()}
                />
                <StatCard 
                  icon={<Heart size={18} className="text-red-400" />}
                  label="Likes Received"
                  value={stats.totalLikesReceived.toString()}
                />
                <StatCard 
                  icon={<Users size={18} className="text-fuchsia-400" />}
                  label="Accessible Albums"
                  value={loadingEvents ? '...' : events.length.toString()}
                />
              </div>
            </div>

            {/* Facial Recognition Hub (Inspiration implementation) */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Camera size={20} className="text-fuchsia-400" />
                Facial Recognition Hub
              </h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-2xl">
                Uploading a reference selfie allows our system to analyze the album directories and automatically collect all photos containing your face into a personalized section. Your facial descriptors are stored securely as mathematical embeddings.
              </p>
              
              <div className="border-2 border-dashed border-slate-700 hover:border-fuchsia-500/50 bg-slate-950/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group">
                <div className="w-14 h-14 rounded-full bg-fuchsia-500/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-fuchsia-500/20 transition-all">
                  <Camera size={24} className="text-fuchsia-400" />
                </div>
                <h4 className="text-white font-medium mb-1">Upload Selfie Reference</h4>
                <p className="text-slate-500 text-xs">Select a clear, front-facing portrait photo</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function ShieldIcon({ role }: { role: string }) {
  // Simple mini icon logic for the badge
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 0L0 2.66667V6.66667C0 10.3667 2.56 13.82 6 14C9.44 13.82 12 10.3667 12 6.66667V2.66667L6 0ZM6 6.5H10.66C10.34 9.14667 8.5 11.4533 6 12.0867V6.5H1.33333V3.6L6 1.52667V6.5Z" fill="currentColor"/>
    </svg>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col items-center text-center">
      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</h4>
    </div>
  );
}
