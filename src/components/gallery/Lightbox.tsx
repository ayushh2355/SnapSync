'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, Download, Loader2, Star, UserPlus, Search } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';

interface Media {
  _id: string;
  fileUrl: string;
  tags: string[];
  detectedUsers?: { _id: string; name: string }[];
}

interface Comment {
  _id: string;
  text: string;
  userId: { _id: string; name: string };
  createdAt: string;
}

interface LightboxProps {
  isOpen: boolean;
  mediaList: Media[];
  selectedIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ 
  isOpen, 
  mediaList, 
  selectedIndex, 
  onClose, 
  onNext, 
  onPrev 
}) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavourited, setIsFavourited] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isTagging, setIsTagging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{_id: string, name: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localTaggedUsers, setLocalTaggedUsers] = useState<{_id: string, name: string}[]>([]);

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

  const handleTagUser = async (user: {_id: string, name: string}) => {
    if (localTaggedUsers.find(u => u._id === user._id)) return;
    try {
      const res = await apiClient(`/api/media/${currentMedia._id}/tags`, {
        method: 'POST',
        body: JSON.stringify({ userId: user._id })
      });
      setLocalTaggedUsers(res.data);
      setSearchQuery('');
      setIsTagging(false);
      toast({ title: 'User Tagged', description: `${user.name} has been tagged.` });
    } catch (err: unknown) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link Copied', description: 'URL has been copied to your clipboard.' });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const token = document.cookie.match(/(^|;\s*)token=([^;]+)/)?.[2];
      const res = await fetch(`/api/media/${currentMedia._id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snapsync-${currentMedia._id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast({ title: 'Downloaded', description: 'Media has been downloaded successfully.' });
    } catch (_) {
      toast({ title: 'Download Error', description: 'Failed to download media.', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/95 backdrop-blur-sm">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 md:right-auto md:left-4 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
      >
        <X size={24} />
      </button>

      <div className="flex-1 relative flex items-center justify-center">
        <button 
          onClick={onPrev}
          className="absolute left-4 z-50 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
          disabled={selectedIndex === 0}
          style={{ opacity: selectedIndex === 0 ? 0.3 : 1 }}
        >
          <ChevronLeft size={32} />
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={currentMedia.fileUrl} 
          alt="Expanded media" 
          className="max-h-screen max-w-full object-contain"
        />

        <button 
          onClick={onNext}
          className="absolute right-4 z-50 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
          disabled={selectedIndex === mediaList.length - 1}
          style={{ opacity: selectedIndex === mediaList.length - 1 ? 0.3 : 1 }}
        >
          <ChevronRight size={32} />
        </button>
      </div>

      <div className="w-full md:w-[400px] h-full bg-gray-900 border-l border-gray-800 flex flex-col flex-shrink-0">
        
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
          <div className="flex items-center gap-4 text-white">
            <button onClick={handleLike} className="flex items-center gap-2 hover:text-red-400 transition-colors">
              <Heart size={24} className={isLiked ? "fill-red-500 text-red-500" : ""} />
              <span className="font-semibold">{likeCount}</span>
            </button>
            <div className="flex items-center gap-2">
              <MessageCircle size={24} />
              <span className="font-semibold">{comments.length}</span>
            </div>
          </div>

          <div className="flex gap-3 text-white">
            <button onClick={handleFavourite} className="p-2 hover:bg-gray-800 rounded-full transition-colors" title="Add to Favourites">
              <Star size={20} className={isFavourited ? "fill-yellow-500 text-yellow-500" : ""} />
            </button>
            <button onClick={handleShare} className="p-2 hover:bg-gray-800 rounded-full transition-colors" title="Copy Link">
              <Share2 size={20} />
            </button>
            <button onClick={handleDownload} disabled={isDownloading} className="p-2 hover:bg-gray-800 rounded-full transition-colors" title="Download">
              {isDownloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
            </button>
          </div>
        </div>

        {currentMedia.tags.length > 0 && (
          <div className="p-4 border-b border-gray-800">
            <div className="flex flex-wrap gap-2">
              {currentMedia.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-b border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">People in this photo</h4>
            {isAuthenticated && (
              <button 
                onClick={() => setIsTagging(!isTagging)}
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              >
                <UserPlus size={14} /> {isTagging ? 'Cancel' : 'Tag'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mb-2">
            {localTaggedUsers.length === 0 ? (
              <span className="text-sm text-gray-500">No one tagged yet.</span>
            ) : (
              localTaggedUsers.map(user => (
                <span key={user._id} className="text-sm bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-full flex items-center gap-1">
                  @ {user.name}
                </span>
              ))
            )}
          </div>

          {isTagging && (
            <div className="mt-3 relative">
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                <Search size={16} className="text-gray-400 mr-2" />
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
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f172a] border border-gray-800 rounded-lg shadow-xl overflow-hidden z-50">
                  {isSearching ? (
                    <div className="p-3 text-sm text-gray-400 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Searching...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No users found.</div>
                  ) : (
                    searchResults.map(user => (
                      <button
                        key={user._id}
                        onClick={() => handleTagUser(user)}
                        className="w-full text-left p-3 hover:bg-gray-800 text-sm text-gray-300 transition-colors border-b border-gray-800/50 last:border-0"
                      >
                        {user.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {isLoadingStats ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-500" /></div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No comments yet.</div>
          ) : (
            comments.map(comment => (
              <div key={comment._id} className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-white text-sm">{comment.userId.name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{comment.text}</p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-900">
          <form onSubmit={handlePostComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <button 
              type="submit" 
              disabled={!newComment.trim() || isPostingComment}
              className="text-blue-500 font-semibold px-4 disabled:opacity-50 hover:text-blue-400 transition-colors text-sm"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
