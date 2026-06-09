'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ImageGrid } from '@/components/gallery/ImageGrid';
import { UploadModal } from '@/components/gallery/UploadModal';
import { apiClient } from '@/lib/apiClient';
import { Plus, Images, ArrowLeft, Upload, ImageOff, Share2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { Modal } from '@/components/ui/Modal';

interface Media {
  _id: string;
  fileUrl: string;
  tags: string[];
  likesCount?: number;
  commentsCount?: number;
  createdAt?: string;
}

export default function EventGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: eventId } = use(params);

  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [eventName, setEventName] = useState('');
  const [clubName, setClubName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/login');
      return;
    }

    if (!isAuthenticated) return;
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [mediaResponse, eventResponse] = await Promise.all([
          apiClient(`/api/media/search?eventId=${eventId}`),
          apiClient(`/api/events/${eventId}`),
        ]);
        if (isMounted) {
          setMediaList(mediaResponse.data.media || []);
          const ev = eventResponse.data;
          setEventName(ev?.name || 'Event');
          setClubName(ev?.category || 'SnapSync');
        }
      } catch (err: unknown) {
        if (isMounted) setError((err as Error).message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [eventId, isAuthenticated, authLoading, router]);

  const handleUploadSuccess = async () => {
    try {
      const response = await apiClient(`/api/media/search?eventId=${eventId}`);
      setMediaList(response.data.media || []);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleDeleteSuccess = (deletedId: string) => {
    setMediaList(prev => prev.filter(m => m._id !== deletedId));
  };

  const totalLikes = mediaList.reduce((sum, m) => sum + (m.likesCount || 0), 0);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-full border-4 border-fuchsia-500/30 border-t-fuchsia-500 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide animate-pulse">Loading Gallery...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-50 via-pink-50 to-rose-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-fuchsia-500/30 relative z-10">

      {/* Ambient background glow - Dark Mode */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden hidden dark:block">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="w-full bg-white/40 backdrop-blur-md border-b border-fuchsia-200/50 dark:border-white/10 sticky top-0 z-30">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 cursor-pointer group mr-2" onClick={() => router.push('/dashboard')}>
              <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-rose-500/10 to-rose-500/5 flex items-center justify-center font-bold text-2xl text-rose-600 shadow-[0_10px_30px_rgba(244,63,94,0.2)] border border-rose-400/30 group-hover:shadow-[0_10px_40px_rgba(244,63,94,0.3)] group-hover:border-rose-400/50 transition-all">
                S
              </div>
              <span className="font-extrabold text-2xl tracking-tight hidden sm:block bg-gradient-to-r from-rose-600 via-rose-900 to-slate-900 text-transparent bg-clip-text group-hover:from-rose-500 group-hover:via-rose-800 group-hover:to-slate-800 transition-all">SnapSync</span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            {/* Stats pills */}
            {mediaList.length > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-semibold px-4 py-2 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 text-slate-800 shadow-sm">
                  {mediaList.length} photo{mediaList.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-sm font-medium px-4 py-2 rounded-full backdrop-blur-md border border-white/50 dark:border-white/10 transition-all shadow-sm active:scale-95"
            >
              <Share2 size={15} />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-blue-600 dark:bg-indigo-600 hover:from-fuchsia-500 hover:to-blue-500 dark:hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-full transition-all shadow-lg shadow-fuchsia-500/20 dark:shadow-indigo-500/20 hover:shadow-fuchsia-500/40 dark:hover:shadow-indigo-500/40 active:scale-95"
            >
              <Upload size={15} />
              <span className="hidden sm:inline">Upload</span>
            </button>

            <NotificationBell />
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 mt-8 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-10">
          <button 
            onClick={() => router.push('/dashboard')} 
            className="w-10 h-10 rounded-full bg-white/40 dark:bg-[#1a1c2e]/60 backdrop-blur-md border border-white/50 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-indigo-600 dark:from-fuchsia-400 dark:to-indigo-400 tracking-tight mb-2">
              {eventName}
            </h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-full text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {clubName}
              </span>
            </div>
          </div>
        </div>
        {error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center mb-4">
              <ImageOff className="w-7 h-7 text-red-500 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Failed to load gallery</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-fuchsia-600 dark:text-indigo-400 hover:text-fuchsia-500 dark:hover:text-indigo-300 transition-colors"
            >
              Try again →
            </button>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            {/* Decorative rings */}
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-fuchsia-500/10 dark:bg-indigo-500/10 scale-150 blur-xl" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-fuchsia-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:to-fuchsia-500/20 border border-fuchsia-200 dark:border-white/10 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:to-fuchsia-500/20 border border-fuchsia-200 dark:border-white/10 flex items-center justify-center">
                  <Images className="w-8 h-8 text-fuchsia-500 dark:text-indigo-400 opacity-80" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No photos yet</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed text-sm">
              This event gallery is empty. Upload your first photo to get started — AI will auto-tag them for you.
            </p>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2.5 bg-gradient-to-r from-fuchsia-600 to-blue-600 dark:bg-indigo-600 hover:from-fuchsia-500 hover:to-blue-500 dark:hover:bg-indigo-500 text-white font-medium px-8 py-3.5 rounded-full transition-all shadow-lg shadow-fuchsia-500/25 dark:shadow-indigo-500/25 hover:shadow-fuchsia-500/40 dark:hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95"
            >
              <Upload size={18} />
              Upload First Photo
            </button>

            <p className="text-xs text-slate-500 mt-6">Supports JPG, PNG, WEBP, HEIC · Max 10MB per file</p>
          </div>
        ) : (
          <ImageGrid
            mediaList={mediaList}
            clubName={clubName}
            eventName={eventName}
            userRole={(user?.role as 'admin' | 'photographer' | 'member' | 'viewer') ?? 'viewer'}
            onDeleteSuccess={handleDeleteSuccess}
          />
        )}
      </main>

      {/* FAB — only show when there's content */}
      {mediaList.length > 0 && (
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="fixed bottom-8 right-8 z-20 flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-blue-600 dark:bg-indigo-600 hover:from-fuchsia-500 hover:to-blue-500 dark:hover:bg-indigo-500 text-white font-medium pl-5 pr-6 py-3.5 rounded-full shadow-2xl shadow-fuchsia-500/30 dark:shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 hover:shadow-fuchsia-500/50 dark:hover:shadow-indigo-500/50"
          aria-label="Upload Media"
        >
          <Plus size={20} />
          <span className="text-sm">Upload</span>
        </button>
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        eventId={eventId}
        onUploadSuccess={handleUploadSuccess}
      />

      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Album">
        <div className="flex flex-col items-center text-center p-4">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Scan this QR code to quickly access the <strong>{eventName}</strong> album on any device.
          </p>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`} 
              alt="QR Code" 
              className="w-48 h-48"
            />
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
              alert('Link copied to clipboard!');
            }}
            className="text-fuchsia-600 dark:text-fuchsia-400 font-medium text-sm hover:underline"
          >
            Copy Album Link
          </button>
        </div>
      </Modal>
    </div>
  );
}
