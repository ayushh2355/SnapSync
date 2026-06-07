'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ImageGrid } from '@/components/gallery/ImageGrid';
import { UploadModal } from '@/components/gallery/UploadModal';
import { apiClient } from '@/lib/apiClient';
import { Plus, Images, ArrowLeft, Upload, ImageOff } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';

interface Media {
  _id: string;
  fileUrl: string;
  tags: string[];
  likesCount?: number;
  commentsCount?: number;
}

export default function EventGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: eventId } = use(params);

  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/login');
      return;
    }

    if (!isAuthenticated) return;
    let isMounted = true;
    const fetchMedia = async () => {
      try {
        const response = await apiClient(`/api/media/search?eventId=${eventId}`);
        if (isMounted) setMediaList(response.data.media || []);
      } catch (err: unknown) {
        if (isMounted) setError((err as Error).message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMedia();
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

  const totalLikes = mediaList.reduce((sum, m) => sum + (m.likesCount || 0), 0);

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-slate-400 font-medium tracking-wide animate-pulse">Loading Gallery...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">

      {/* Ambient background glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Dashboard
            </button>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Images size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white leading-tight">Event Gallery</h1>
                <p className="text-xs text-slate-500 leading-tight">View and manage media</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats pills */}
            {mediaList.length > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                  {mediaList.length} photo{mediaList.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                  ♥ {totalLikes}
                </span>
              </div>
            )}

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-full transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-95"
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
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 pb-24">

        {error ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
              <ImageOff className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load gallery</h2>
            <p className="text-slate-400 text-sm max-w-sm mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Try again →
            </button>
          </div>
        ) : mediaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            {/* Decorative rings */}
            <div className="relative mb-8">
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 scale-150 blur-xl" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 border border-white/10 flex items-center justify-center">
                  <Images className="w-8 h-8 text-indigo-400 opacity-80" />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">No photos yet</h2>
            <p className="text-slate-400 max-w-sm mb-8 leading-relaxed text-sm">
              This event gallery is empty. Upload your first photo to get started — AI will auto-tag them for you.
            </p>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 py-3.5 rounded-full transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95"
            >
              <Upload size={18} />
              Upload First Photo
            </button>

            <p className="text-xs text-slate-600 mt-6">Supports JPG, PNG, WEBP, HEIC · Max 10MB per file</p>
          </div>
        ) : (
          <ImageGrid mediaList={mediaList} />
        )}
      </main>

      {/* FAB — only show when there's content */}
      {mediaList.length > 0 && (
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="fixed bottom-8 right-8 z-20 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium pl-5 pr-6 py-3.5 rounded-full shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 hover:shadow-indigo-500/50"
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
    </div>
  );
}
