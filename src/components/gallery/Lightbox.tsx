'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, Download, Loader2, Star, UserPlus, Search, Trash2, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { useWatermarkDownload } from '@/hooks/use-watermark-download';
import { toDisplayUrl } from '@/lib/cloudinaryUrl';

interface Media {
  _id: string;
  fileUrl: string;
  tags: string[];
  detectedUsers?: { _id: string; name: string }[];
  uploadedBy?: { _id: string; name: string };
}

interface Comment {
  _id: string;
  text: string;
  userId: { _id: string; name: string };
  createdAt: string;
}

type UserRole = 'admin' | 'photographer' | 'member' | 'viewer';

interface LightboxProps {
  isOpen: boolean;
  mediaList: Media[];
  selectedIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  clubName: string;
  eventName: string;
  userRole: UserRole;
  onDeleteSuccess: (id: string) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ 
  isOpen, 
  mediaList, 
  selectedIndex, 
  onClose, 
  onNext, 
  onPrev,
  clubName,
  eventName,
  userRole,
  onDeleteSuccess,
}) => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const { isDownloading, download } = useWatermarkDownload();
  
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavourited, setIsFavourited] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{_id: string, name: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localTaggedUsers, setLocalTaggedUsers] = useState<{_id: string, name: string}[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentMedia = mediaList[selectedIndex];

  useEffect(() => {
    setLocalTaggedUsers(currentMedia?.detectedUsers || []);
  }, [currentMedia]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiClient(`/api/user/search?q=${searchQuery}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen || !currentMedia) return;

    const fetchStatsAndComments = async () => {
      setIsLoadingStats(true);
      try {
        const [statsRes, commentsRes] = await Promise.all([
          apiClient(`/api/social/stats/${currentMedia._id}`),
          apiClient(`/api/social/comments/${currentMedia._id}`)
        ]);
        
        setLikeCount(statsRes.data.likeCount || 0);
        setIsLiked(statsRes.data.isLikedByUser || false);
        setIsFavourited(statsRes.data.isFavourited || false);
        setComments(commentsRes.data?.comments || []);
      } catch (error) {
        console.error('Failed to load media interactions', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStatsAndComments();
  }, [isOpen, currentMedia]);

  if (!isOpen || !currentMedia) return null;

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Sign in required', description: 'Please sign in to like photos.' });
      return;
    }

    try {
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);

      const res = await apiClient(`/api/social/like/${currentMedia._id}`, { method: 'POST' });
      
      setLikeCount(res.data.likeCount);
      setIsLiked(res.data.liked);
    } catch (_) {
      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      toast({ title: 'Error', description: 'Failed to update like status', variant: 'destructive' });
    }
  };

  const handleFavourite = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Sign in required', description: 'Please sign in to favourite photos.' });
      return;
    }

    try {
      setIsFavourited(!isFavourited);
      const res = await apiClient(`/api/social/favourite/${currentMedia._id}`, { method: 'POST' });
      setIsFavourited(res.data.isFavourited);
    } catch (_) {
      setIsFavourited(!isFavourited);
      toast({ title: 'Error', description: 'Failed to update favourite status', variant: 'destructive' });
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: 'Sign in required', description: 'Please sign in to comment.' });
      return;
    }
    if (!newComment.trim()) return;

    setIsPostingComment(true);
    try {
      const res = await apiClient(`/api/social/comments/${currentMedia._id}`, {
        method: 'POST',
        body: JSON.stringify({ text: newComment.trim() }),
      });
      
      setComments(prev => [res.data, ...prev]);
      setNewComment('');
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message || 'Failed to post comment', variant: 'destructive' });
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleTagUser = async (userToTag: {_id: string, name: string}) => {
    if (localTaggedUsers.find(u => u._id === userToTag._id)) return;
    try {
      const res = await apiClient(`/api/media/${currentMedia._id}/tags`, {
        method: 'POST',
        body: JSON.stringify({ userId: userToTag._id })
      });
      setLocalTaggedUsers(res.data);
      setSearchQuery('');
      setIsTagging(false);
      toast({ title: 'User Tagged', description: `${userToTag.name} has been tagged.` });
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleDownload = async () => {
    try {
      await download(
        currentMedia.fileUrl,
        clubName,
        eventName,
        userRole,
        `snapsync-${currentMedia._id}.jpg`,
      );
      toast({ title: 'Downloaded', description: 'Media has been downloaded successfully.' });
    } catch (_) {
      toast({ title: 'Download Error', description: 'Failed to download media.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    setIsDeleting(true);
    try {
      await apiClient(`/api/media/${currentMedia._id}`, { method: 'DELETE' });
      toast({ title: 'Deleted', description: 'Photo has been deleted successfully.' });
      onClose();
      onDeleteSuccess(currentMedia._id);
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message || 'Failed to delete photo', variant: 'destructive' });
      setIsDeleting(false);
    }
  };

  const isUploader = currentMedia.uploadedBy?._id === user?.id;
  const isAdmin = user?.role === 'Admin';
  const canDelete = isAdmin || isUploader;

  // Extract a faux filename from the URL or ID
  const filename = currentMedia.fileUrl.split('/').pop() || `snapsync-${currentMedia._id}.jpg`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0f172a] overflow-hidden">
      
      {/* Top Navigation Bar */}
      <div className="h-20 border-b border-white/5 flex items-center px-6 shrink-0 bg-slate-900/50 backdrop-blur-md">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all mr-6 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div className="flex flex-col">
          <div className="text-xs font-medium text-slate-400 mb-1">
            {eventName} <span className="mx-1">&gt;</span> Photo View
          </div>
          <h2 className="text-lg font-semibold text-white tracking-wide truncate max-w-lg">
            {filename}
          </h2>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Main Image Area */}
        <div className="flex-1 relative flex items-center justify-center p-8">
          <button 
            onClick={onPrev}
            className="absolute left-8 z-50 p-4 bg-slate-900/80 hover:bg-indigo-600 rounded-full text-white transition-all shadow-xl backdrop-blur-md border border-white/10 hover:border-transparent group"
            disabled={selectedIndex === 0}
            style={{ opacity: selectedIndex === 0 ? 0 : 1, pointerEvents: selectedIndex === 0 ? 'none' : 'auto' }}
          >
            <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={toDisplayUrl(currentMedia.fileUrl)}
              crossOrigin="anonymous"
              alt="Expanded media" 
              className="max-h-full max-w-full object-contain bg-black/40"
              style={{ maxHeight: 'calc(100vh - 160px)' }}
            />
          </div>

          <button 
            onClick={onNext}
            className="absolute right-8 z-50 p-4 bg-slate-900/80 hover:bg-indigo-600 rounded-full text-white transition-all shadow-xl backdrop-blur-md border border-white/10 hover:border-transparent group"
            disabled={selectedIndex === mediaList.length - 1}
            style={{ opacity: selectedIndex === mediaList.length - 1 ? 0 : 1, pointerEvents: selectedIndex === mediaList.length - 1 ? 'none' : 'auto' }}
          >
            <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Right Sidebar */}
        <div className="w-full md:w-[420px] bg-[#0b1120] border-l border-white/5 flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {/* Top Actions Box */}
            <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-2xl border border-white/5 shadow-inner">
              <button 
                onClick={handleLike} 
                className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all ${isLiked ? 'bg-red-500/10 text-red-500' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
              >
                <Heart size={20} className={isLiked ? "fill-red-500" : ""} />
                <span className="text-[10px] font-medium mt-1">{likeCount}</span>
              </button>
              <button 
                onClick={handleFavourite} 
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${isFavourited ? 'bg-yellow-500/10 text-yellow-500' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                title="Add to Favourites"
              >
                <Star size={20} className={isFavourited ? "fill-yellow-500" : ""} />
              </button>
              <button 
                onClick={handleDownload} 
                disabled={isDownloading} 
                className="flex-1 h-12 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-70"
              >
                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                <span>Download</span>
              </button>
              {canDelete && (
                <button 
                  onClick={handleDelete} 
                  disabled={isDeleting} 
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  title="Delete Photo"
                >
                  {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                </button>
              )}
            </div>

            {/* Properties Panel */}
            <div className="bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">Properties</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Uploaded by</span>
                  <span className="text-white font-medium">{currentMedia.uploadedBy?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Event Album</span>
                  <span className="text-indigo-400 font-medium">{eventName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Club</span>
                  <span className="text-white font-medium">{clubName}</span>
                </div>
              </div>
            </div>

            {/* AI Auto Tags */}
            <div className="bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">AI Auto Tags</h3>
              </div>
              <div className="p-5 flex flex-wrap gap-2">
                {currentMedia.tags.length === 0 ? (
                  <span className="text-sm text-slate-500">No tags found.</span>
                ) : (
                  currentMedia.tags.map(tag => (
                    <span key={tag} className="text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-lg">
                      #{tag}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Detected Users */}
            <div className="bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">Detected Users</h3>
                {isAuthenticated && (
                  <button 
                    onClick={() => setIsTagging(!isTagging)}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <UserPlus size={12} /> {isTagging ? 'Cancel' : 'Tag'}
                  </button>
                )}
              </div>
              
              <div className="p-5">
                <div className="flex flex-wrap gap-2">
                  {localTaggedUsers.length === 0 ? (
                    <span className="text-sm text-slate-500">No users detected/tagged.</span>
                  ) : (
                    localTaggedUsers.map(u => (
                      <span key={u._id} className="text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg">
                        @{u.name}
                      </span>
                    ))
                  )}
                </div>

                {isTagging && (
                  <div className="mt-4 relative animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
                      <Search size={16} className="text-slate-500 mr-2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search to tag..."
                        className="bg-transparent border-none text-sm text-white focus:outline-none w-full"
                        autoFocus
                      />
                    </div>
                    {searchQuery.length >= 2 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                        {isSearching ? (
                          <div className="p-4 text-sm text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin" /> Searching...
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-4 text-sm text-center text-slate-500">No users found.</div>
                        ) : (
                          searchResults.map(u => (
                            <button
                              key={u._id}
                              onClick={() => handleTagUser(u)}
                              className="w-full text-left px-4 py-3 hover:bg-slate-800 text-sm font-medium text-slate-300 transition-colors border-b border-slate-800/50 last:border-0"
                            >
                              {u.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="bg-slate-900/40 rounded-2xl border border-white/5 flex flex-col flex-1 min-h-[300px]">
              <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
                <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">Comments</h3>
                <span className="text-xs font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{comments.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[400px]">
                {isLoadingStats ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-slate-500" /></div>
                ) : comments.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 py-8">
                    No comments yet. Start the conversation!
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment._id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">{comment.userId.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-white text-sm">{comment.userId.name}</span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-white/5 bg-slate-900/50 rounded-b-2xl">
                <form onSubmit={handlePostComment} className="flex items-center gap-2 bg-slate-950 border border-white/5 rounded-xl pr-1 pl-4 py-1">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent border-none text-sm text-white py-2 focus:outline-none placeholder:text-slate-600"
                  />
                  <button 
                    type="submit" 
                    disabled={!newComment.trim() || isPostingComment}
                    className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-indigo-600"
                  >
                    Post
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
