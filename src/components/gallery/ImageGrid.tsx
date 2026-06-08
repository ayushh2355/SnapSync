'use client';

import React, { useState, useMemo } from 'react';
import { Heart, MessageCircle, Download, Loader2, Search, Filter } from 'lucide-react';
import { Lightbox } from './Lightbox';
import { useWatermarkDownload } from '@/hooks/use-watermark-download';
import { toDisplayUrl } from '@/lib/cloudinaryUrl';
import { useAuth } from '@/providers/AuthProvider';

interface Media {
  _id: string;
  fileUrl: string;
  tags: string[];
  likesCount?: number;
  commentsCount?: number;
  uploadedBy?: { _id: string; name: string };
  detectedUsers?: { _id: string; name: string }[];
}

type UserRole = 'admin' | 'photographer' | 'member' | 'viewer';

interface ImageGridProps {
  mediaList: Media[];
  clubName: string;
  eventName: string;
  userRole: UserRole;
  onDeleteSuccess: (id: string) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ mediaList, clubName, eventName, userRole, onDeleteSuccess }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { isDownloading, download } = useWatermarkDownload();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUploader, setSelectedUploader] = useState<string>('all');

  const uniqueUploaders = useMemo(() => {
    const map = new Map<string, string>();
    mediaList.forEach(m => {
      if (m.uploadedBy?._id) map.set(m.uploadedBy._id, m.uploadedBy.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [mediaList]);

  const filteredMedia = useMemo(() => {
    return mediaList.filter(media => {
      const matchesUploader = selectedUploader === 'all' || media.uploadedBy?._id === selectedUploader;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (media.tags?.some(t => t.toLowerCase().includes(searchLower))) ||
        (media.uploadedBy?.name?.toLowerCase().includes(searchLower));
      return matchesUploader && matchesSearch;
    });
  }, [mediaList, searchTerm, selectedUploader]);

  const myUploads = useMemo(() => {
    if (!user) return [];
    return filteredMedia.filter(m => m.uploadedBy?._id === user.id);
  }, [filteredMedia, user]);

  const otherUploads = useMemo(() => {
    if (!user) return filteredMedia;
    return filteredMedia.filter(m => m.uploadedBy?._id !== user.id);
  }, [filteredMedia, user]);

  const handleCardDownload = async (e: React.MouseEvent, media: Media) => {
    e.stopPropagation();
    setDownloadingId(media._id);
    await download(media.fileUrl, clubName, eventName, userRole, `snapsync-${media._id}.jpg`);
    setDownloadingId(null);
  };

  const renderGridItems = (items: Media[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
      {items.map((media) => (
        <div
          key={media._id}
          className="relative group overflow-hidden rounded-xl border border-white/5 bg-slate-900 cursor-pointer aspect-square shadow-sm"
          onClick={() => setSelectedIndex(filteredMedia.findIndex(m => m._id === media._id))}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={toDisplayUrl(media.fileUrl)}
            crossOrigin="anonymous"
            alt="Event media"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <button
              onClick={(e) => handleCardDownload(e, media)}
              disabled={isDownloading}
              className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/40 hover:bg-indigo-600 backdrop-blur-md text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
            >
              {downloadingId === media._id
                ? <Loader2 size={16} className="animate-spin" />
                : <Download size={16} />}
            </button>
            <div className="flex gap-4 mb-2 text-white">
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <Heart size={14} className="text-red-500 fill-red-500" /> {media.likesCount || 0}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                <MessageCircle size={14} className="text-blue-400" /> {media.commentsCount || 0}
              </span>
            </div>
            {media.tags && media.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {media.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] font-medium bg-white/10 text-white border border-white/10 px-2 py-0.5 rounded-md backdrop-blur-md">
                    {tag}
                  </span>
                ))}
                {media.tags.length > 3 && (
                  <span className="text-[10px] font-medium bg-white/10 text-white border border-white/10 px-2 py-0.5 rounded-md backdrop-blur-md">
                    +{media.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (mediaList.length === 0) {
    return (
      <div className="text-slate-400 text-center py-20 bg-slate-900/30 border border-white/5 rounded-2xl">
        No media uploaded yet.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 bg-slate-900/40 p-3 sm:p-4 rounded-2xl border border-white/5 shadow-lg">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search tags or uploader name..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="relative w-full sm:w-auto min-w-[200px]">
          <select
            value={selectedUploader}
            onChange={e => setSelectedUploader(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm text-white appearance-none focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">✓ All Uploaders</option>
            {uniqueUploaders.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
            <Filter size={16} />
          </div>
        </div>
      </div>

      {filteredMedia.length === 0 ? (
        <div className="text-slate-500 text-center py-20 bg-slate-900/40 border border-white/5 rounded-2xl">
          No media found matching your search criteria.
        </div>
      ) : (
        <div className="space-y-10">
          {myUploads.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-5">
                <h3 className="text-xs font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                  Your Uploads
                </h3>
                <div className="h-px bg-white/5 flex-1" />
              </div>
              {renderGridItems(myUploads)}
            </div>
          )}

          {otherUploads.length > 0 && (
            <div>
              {myUploads.length > 0 && (
                <div className="flex items-center gap-4 mb-5">
                  <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                    Other Images
                  </h3>
                  <div className="h-px bg-white/5 flex-1" />
                </div>
              )}
              {renderGridItems(otherUploads)}
            </div>
          )}
        </div>
      )}

      <Lightbox 
        isOpen={selectedIndex !== null}
        mediaList={filteredMedia}
        selectedIndex={selectedIndex || 0}
        onClose={() => setSelectedIndex(null)}
        onNext={() => setSelectedIndex(prev => prev !== null ? Math.min(prev + 1, filteredMedia.length - 1) : null)}
        onPrev={() => setSelectedIndex(prev => prev !== null ? Math.max(prev - 1, 0) : null)}
        clubName={clubName}
        eventName={eventName}
        userRole={userRole}
        onDeleteSuccess={onDeleteSuccess}
      />
    </>
  );
};
