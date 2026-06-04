'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ImageGrid } from '@/components/gallery/ImageGrid';
import { UploadModal } from '@/components/gallery/UploadModal';
import { apiClient } from '@/lib/apiClient';
import { Plus } from 'lucide-react';

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

  useEffect(() => {
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
  }, [eventId]);

  const handleUploadSuccess = async () => {
    try {
      const response = await apiClient(`/api/media/search?eventId=${eventId}`);
      setMediaList(response.data.media || []);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading gallery...</div>;
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto relative pb-24">
      <div className="flex justify-between items-center mb-8">
        <div>
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white text-sm mb-4 transition-colors">
            &larr; Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white">Event Gallery</h1>
          <p className="text-gray-400 mt-2">View and manage media for this event.</p>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-md text-red-500">{error}</div>
      ) : (
        <ImageGrid mediaList={mediaList} />
      )}

      <button
        onClick={() => setIsUploadModalOpen(true)}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all hover:scale-105 active:scale-95"
        aria-label="Upload Media"
      >
        <Plus size={24} />
      </button>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        eventId={eventId}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
