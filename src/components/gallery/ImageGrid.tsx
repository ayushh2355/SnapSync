'use client';

import React, { useState, useMemo } from 'react';
import { Heart, MessageCircle, Download, Loader2, Search, Filter, Maximize2 } from 'lucide-react';
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
          className="relative group overflow-hidden rounded-2xl border border-white/40 bg-white/40 cursor-pointer h-64 shadow-sm"
          onClick={() => setSelectedIndex(filteredMedia.findIndex(m => m._id === media._id))}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={toDisplayUrl(media.fileUrl)}
            crossOrigin="anonymous"
            alt="Event media"
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Always visible or hover-visible likes at bottom left */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
            {(media.likesCount || 0) > 0 && (
              <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-medium flex items-center gap-1.5">
                <Heart size={12} className="fill-white" />
                {media.likesCount}
              </div>
            )}
            {(media.commentsCount || 0) > 0 && (
              <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-medium flex items-center gap-1.5">
                <MessageCircle size={12} className="text-white" />
                {media.commentsCount}
              </div>
            )}
          </div>

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4">
            {/* Download button stays interactive */}
            <button
              onClick={(e) => handleCardDownload(e, media)}
              disabled={isDownloading}
              className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/40 hover:bg-indigo-600 backdrop-blur-md text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-50 z-20"
            >
              {downloadingId === media._id
                ? <Loader2 size={16} className="animate-spin" />
                : <Download size={16} />}
            </button>
            
            {/* Centered Expand Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-200">
                <Maximize2 size={20} className="text-white" />
              </div>
            </div>

            {media.tags && media.tags.length > 0 && (
              <div className="absolute bottom-3 right-3 flex flex-wrap justify-end gap-1.5 pointer-events-none">
                {media.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] font-medium bg-white/20 text-white border border-white/10 px-2 py-0.5 rounded-md backdrop-blur-md">
                    {tag}
                  </span>
                ))}
                {media.tags.length > 3 && (
                  <span className="text-[10px] font-medium bg-white/20 text-white border border-white/10 px-2 py-0.5 rounded-md backdrop-blur-md">
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
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 bg-white/40 bg-gradient-to-r from-fuchsia-500/5 via-fuchsia-500/5 to-transparent backdrop-blur-md border border-fuchsia-400/30 rounded-[20px] p-4 shadow-[0_15px_40px_rgba(217,70,239,0.1)] hover:shadow-[0_0_60px_rgba(217,70,239,0.3)] hover:border-fuchsia-500/50 transition-all duration-500">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search tags or uploader name..."
            className="w-full bg-white/60 dark:bg-slate-950/50 border border-fuchsia-200/50 dark:border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-fuchsia-500 dark:focus:border-white/30 transition-colors placeholder:text-slate-400 dark:placeholder:text-white/40"
          />
        </div>
        <div className="relative w-full sm:w-auto min-w-[200px]">
          <select
            value={selectedUploader}
            onChange={e => setSelectedUploader(e.target.value)}
            className="w-full bg-white/60 dark:bg-slate-950/50 border border-fuchsia-200/50 dark:border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm text-slate-900 dark:text-white appearance-none focus:outline-none focus:border-fuchsia-500 dark:focus:border-white/30 transition-colors"
          >
            <option value="all">✓ All Uploaders</option>
            {uniqueUploaders.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-400">
            <Filter size={16} />
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/10 via-fuchsia-500/5 to-transparent backdrop-blur-md shadow-[0_30px_80px_rgba(217,70,239,0.15)] hover:shadow-[0_0_100px_rgba(217,70,239,0.4)] hover:border-fuchsia-500/60 p-6 sm:p-8 min-h-[400px] transition-all duration-500 bg-white/40">

      {filteredMedia.length === 0 ? (
        <div className="text-slate-500 text-center py-20 bg-slate-900/40 border border-white/5 rounded-2xl">
          No media found matching your search criteria.
        </div>
      ) : (
        <div className="space-y-10">
          {myUploads.length > 0 && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-2xl lg:text-3xl font-semibold text-slate-900 tracking-tight">Your Uploads</h3>
                <div className="bg-white/30 backdrop-blur-sm rounded-full px-3 py-1 text-sm border border-white/40 shadow-sm text-slate-800 font-medium">
                  {myUploads.length} Photo{myUploads.length !== 1 ? 's' : ''}
                </div>
              </div>
              {renderGridItems(myUploads)}
            </div>
          )}

          {otherUploads.length > 0 && (
            <div>
              {myUploads.length > 0 && (
                <div className="flex items-center gap-4 mb-8">
                  <h3 className="text-2xl lg:text-3xl font-semibold text-slate-900 tracking-tight">Other Images</h3>
                  <div className="bg-white/30 backdrop-blur-sm rounded-full px-3 py-1 text-sm border border-white/40 shadow-sm text-slate-800 font-medium">
                    {otherUploads.length} Photo{otherUploads.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
              {renderGridItems(otherUploads)}
            </div>
          )}
        </div>
      )}
      </div>

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
