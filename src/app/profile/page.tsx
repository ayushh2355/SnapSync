'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/apiClient';
import { Lightbox } from '@/components/gallery/Lightbox';
import { Camera, Activity, Image as ImageIcon, Heart, Users, FolderOpen, ArrowLeft, ImagePlus } from 'lucide-react';
import { detectSingleFaceDescriptor } from '@/lib/face-api';

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
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [isUploadingSelfie, setIsUploadingSelfie] = useState(false);
  const [myPhotos, setMyPhotos] = useState<any[]>([]);
  const [myUploads, setMyUploads] = useState<any[]>([]);
  const [loadingMyPhotos, setLoadingMyPhotos] = useState(false);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [lightboxSource, setLightboxSource] = useState<'myPhotos' | 'myUploads'>('myPhotos');
  const [roleRequests, setRoleRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = require('@/hooks/use-toast');

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

      // Fetch pending role requests for Admins
      if (user.role === 'Admin') {
        setLoadingRequests(true);
        apiClient('/api/admin/role-requests')
          .then((res) => {
            if (res.success) {
              setRoleRequests(res.data);
            }
          })
          .catch(console.error)
          .finally(() => setLoadingRequests(false));
      }

      // Fetch user's uploaded media to calculate stats
      apiClient(`/api/media/search?uploadedBy=${user.id}&limit=100`)
        .then((res) => {
          if (res.success) {
            const media = res.data.media || [];
            setMyUploads(media);
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
        .catch(console.error)
        .finally(() => setLoadingUploads(false));

      // Fetch user's reference photo
      apiClient('/api/users/profile/reference')
        .then((res) => {
          if (res.success && res.data?.selfieUrl) {
            setReferenceUrl(res.data.selfieUrl);
            
            setLoadingMyPhotos(true);
            apiClient(`/api/media/search?detectedUserId=${user.id}&limit=50`)
              .then((searchRes) => {
                if (searchRes.success) {
                  setMyPhotos(searchRes.data.media || []);
                }
              })
              .catch(console.error)
              .finally(() => setLoadingMyPhotos(false));
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user]);

  const handleRoleRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/role-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Success', description: `Request ${status} successfully` });
        setRoleRequests((prev) => prev.filter((req) => req._id !== requestId));
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to update request', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingSelfie(true);
    try {
      // 1. Resize and draw to canvas for face-api
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });

      const canvas = document.createElement('canvas');
      const MAX_DIMENSION = 1000;
      let width = img.width;
      let height = img.height;

      if (width > height && width > MAX_DIMENSION) {
        height *= MAX_DIMENSION / width;
        width = MAX_DIMENSION;
      } else if (height > MAX_DIMENSION) {
        width *= MAX_DIMENSION / height;
        height = MAX_DIMENSION;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
      }

      // 2. Extract facial features
      toast({ title: 'Processing', description: 'Extracting facial features securely on your device...' });
      const descriptor = await detectSingleFaceDescriptor(canvas);
      
      if (!descriptor) {
        toast({ title: 'Error', description: 'No face detected in the photo. Please use a clear, front-facing portrait.', variant: 'destructive' });
        setIsUploadingSelfie(false);
        URL.revokeObjectURL(objectUrl);
        return;
      }

      URL.revokeObjectURL(objectUrl);

      // 3. Send raw image + descriptor vector to backend
      const formData = new FormData();
      formData.append('selfie', file);
      formData.append('faceDescriptor', JSON.stringify(descriptor));
      
      const res = await fetch('/api/user/selfie', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Success', description: 'Selfie reference uploaded securely.' });
        setReferenceUrl(data.data.selfieUrl);
        
        // Fetch matched photos now
        setLoadingMyPhotos(true);
        const searchRes = await apiClient(`/api/media/search?detectedUserId=${user.id}&limit=50`);
        if (searchRes.success) {
          setMyPhotos(searchRes.data.media || []);
        }
        setLoadingMyPhotos(false);
      } else {
        toast({ title: 'Error', description: data.error || 'Upload failed', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsUploadingSelfie(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="min-h-screen text-slate-900 dark:text-gray-100 font-sans selection:bg-fuchsia-500/30 pb-20 relative z-10">

      {/* Top Header */}
      <div className="h-24 px-8 max-w-7xl mx-auto flex justify-between items-end pb-4 relative z-20 border-b border-transparent dark:border-[#2d2f45]/60">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">My Profile</h1>
          <p className="text-sm text-slate-500 dark:text-[#9ca3af]">Manage user account credentials and view your activity statistics.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-8 relative z-10">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="flex items-center gap-2 text-slate-500 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white text-sm mb-8 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="col-span-1 flex flex-col gap-6">
            {/* User Card */}
            <div className="bg-white/40 dark:bg-[#1a1c2e]/60 backdrop-blur-md border border-white/50 dark:border-[#2d2f45] transition-all duration-500 hover:shadow-[0_0_80px_rgba(217,70,239,0.3)] dark:hover:shadow-[0_0_60px_rgba(139,92,246,0.3)] hover:border-fuchsia-400/60 dark:hover:border-violet-500/50 rounded-[2rem] p-8 flex flex-col items-center text-center relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 dark:bg-violet-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            
            <div className="w-32 h-32 rounded-full border border-slate-200 dark:border-[#2d2f45] flex items-center justify-center font-bold text-5xl text-fuchsia-600 dark:text-violet-400 bg-slate-50 dark:bg-[#0b0e14] shadow-inner mb-6 relative z-10">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">{user.name}</h2>
            <p className="text-sm text-slate-500 dark:text-[#9ca3af] mb-6">{user.email}</p>
            
            <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${user.roleRequest ? 'mb-3' : 'mb-8'} bg-slate-50 dark:bg-[#0b0e14] ${badgeTheme}`}>
              <ShieldIcon role={user.role} />
              {user.role}
            </div>

            {user.roleRequest && user.roleRequest.status === 'pending' && (
              <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium mb-8 text-center bg-amber-50 dark:bg-amber-500/10 border-amber-200 text-amber-700 dark:text-amber-400`}>
                Request for {user.roleRequest.requestedRole} is waiting for Admin approval.
              </div>
            )}
            
            <button 
              onClick={() => logout()} 
              className="w-full py-3 px-4 bg-slate-100 dark:bg-[#161b22] hover:bg-slate-200 dark:hover:bg-[#1e293b] text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-sm font-semibold transition-all border border-slate-200 dark:border-[#2d2f45]"
            >
              Sign Out
            </button>
          </div>

            {/* Facial Recognition Hub */}
            <div className="bg-white/40 dark:bg-[#1a1c2e]/60 backdrop-blur-md border border-white/50 dark:border-[#2d2f45] transition-all duration-500 hover:shadow-[0_0_80px_rgba(217,70,239,0.3)] dark:hover:shadow-[0_0_60px_rgba(139,92,246,0.3)] hover:border-fuchsia-400/60 dark:hover:border-violet-500/50 rounded-[2rem] p-8">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Camera size={20} className="text-fuchsia-500 dark:text-violet-400" />
                Facial Recognition Hub
              </h3>
              <p className="text-slate-500 dark:text-[#9ca3af] text-sm mb-8 leading-relaxed max-w-2xl">
                Uploading a reference selfie allows our system to analyze the album directories and automatically collect all photos containing your face into a personalized section. Your facial descriptors are stored securely as mathematical embeddings.
              </p>
              
              <div 
                onClick={() => !isUploadingSelfie && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-slate-200 dark:border-[#2d2f45] hover:border-fuchsia-500/50 dark:hover:border-violet-500/50 bg-slate-50/50 dark:bg-[#0b0e14]/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group relative overflow-hidden ${isUploadingSelfie ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {referenceUrl ? (
                  <>
                    <img src={referenceUrl} alt="Reference Selfie" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-center mb-4 shadow-xl">
                        {isUploadingSelfie ? (
                          <div className="w-6 h-6 border-2 border-fuchsia-500 dark:border-fuchsia-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Camera size={24} className="text-fuchsia-600 dark:text-fuchsia-400" />
                        )}
                      </div>
                      <h4 className="text-slate-900 dark:text-white font-medium mb-1 drop-shadow-md">
                        {isUploadingSelfie ? 'Uploading...' : 'Update Reference Selfie'}
                      </h4>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-fuchsia-500/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-fuchsia-500/20 transition-all">
                      {isUploadingSelfie ? (
                        <div className="w-6 h-6 border-2 border-fuchsia-500 dark:border-fuchsia-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Camera size={24} className="text-fuchsia-600 dark:text-fuchsia-400" />
                      )}
                    </div>
                    <h4 className="text-slate-900 dark:text-white font-medium mb-1">
                      {isUploadingSelfie ? 'Uploading...' : 'Upload Selfie Reference'}
                    </h4>
                    <p className="text-slate-500 text-xs">Select a clear, front-facing portrait photo</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpeg, image/png, image/webp" 
                  onChange={handleSelfieUpload} 
                />
              </div>
            </div>
          </div>

          {/* Right Column: Stats & Features */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
            
            {/* Stats Grid */}
            <div className="bg-white/40 dark:bg-[#1a1c2e]/60 backdrop-blur-md border border-white/50 dark:border-[#2d2f45] transition-all duration-500 hover:shadow-[0_0_80px_rgba(217,70,239,0.3)] dark:hover:shadow-[0_0_60px_rgba(139,92,246,0.3)] hover:border-fuchsia-400/60 dark:hover:border-violet-500/50 rounded-[2rem] p-8">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Activity size={20} className="text-fuchsia-500 dark:text-violet-400" />
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

            {/* Admin: Pending Role Requests */}
            {user.role === 'Admin' && roleRequests.length > 0 && (
              <div className="bg-white/40 dark:bg-[#1a1c2e]/60 backdrop-blur-md border border-red-500/20 dark:border-red-500/20 transition-all duration-500 hover:shadow-[0_0_80px_rgba(239,68,68,0.3)] dark:hover:shadow-[0_0_60px_rgba(239,68,68,0.3)] hover:border-red-400/60 dark:hover:border-red-500/50 rounded-[2rem] p-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <ShieldIcon role="Admin" />
                  Pending Role Requests ({roleRequests.length})
                </h3>
                <div className="flex flex-col gap-4">
                  {roleRequests.map((req) => (
                    <div key={req._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-[#0b0e14] rounded-xl border border-slate-200 dark:border-white/10 gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{req.userId?.name || 'Unknown User'}</p>
                        <p className="text-sm text-slate-500">{req.userId?.email || 'No email'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-[#161b22] text-slate-600 dark:text-slate-300 rounded-md">Current: {req.userId?.role}</span>
                          <span className="text-xs px-2 py-1 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 rounded-md font-medium">Requested: {req.requestedRole}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => handleRoleRequest(req._id, 'approved')}
                          className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRoleRequest(req._id, 'rejected')}
                          className="flex-1 sm:flex-none px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Photos Section */}
            {(referenceUrl || myPhotos.length > 0) && (
              <div className="bg-white/40 dark:bg-[#1a1c2e]/60 backdrop-blur-md border border-white/50 dark:border-[#2d2f45] transition-all duration-500 hover:shadow-[0_0_80px_rgba(217,70,239,0.3)] dark:hover:shadow-[0_0_60px_rgba(139,92,246,0.3)] hover:border-fuchsia-400/60 dark:hover:border-violet-500/50 rounded-[2rem] p-8">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <ImagePlus size={20} className="text-fuchsia-500 dark:text-violet-400" />
                  Photos You Appear In
                </h3>
                {loadingMyPhotos ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : myPhotos.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-[#2d2f45] rounded-2xl bg-slate-50/50 dark:bg-[#0b0e14]/50">
                    <p className="text-slate-500 text-sm">No matching photos found yet. Upload more photos to events or give AI some time to process.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {myPhotos.map((photo, index) => (
                      <div 
                        key={photo._id} 
                        onClick={() => {
                          setLightboxSource('myPhotos');
                          setSelectedPhotoIndex(index);
                        }}
                        className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer bg-slate-100 border border-slate-200 dark:border-white/10"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={photo.fileUrl} 
                          alt="You in a photo" 
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                          <span className="text-xs text-white font-medium truncate">{photo.eventId?.name || 'Event'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>


      {(selectedPhotoIndex !== null && ((lightboxSource === 'myPhotos' && myPhotos[selectedPhotoIndex]) || (lightboxSource === 'myUploads' && myUploads[selectedPhotoIndex]))) && (
        <Lightbox 
          isOpen={selectedPhotoIndex !== null}
          mediaList={lightboxSource === 'myPhotos' ? myPhotos : myUploads}
          selectedIndex={selectedPhotoIndex || 0}
          onClose={() => setSelectedPhotoIndex(null)}
          onNext={() => setSelectedPhotoIndex(prev => prev !== null ? Math.min(prev + 1, (lightboxSource === 'myPhotos' ? myPhotos.length : myUploads.length) - 1) : null)}
          onPrev={() => setSelectedPhotoIndex(prev => prev !== null ? Math.max(prev - 1, 0) : null)}
          clubName="SnapSync"
          eventName={(lightboxSource === 'myPhotos' ? myPhotos[selectedPhotoIndex].eventId?.name : myUploads[selectedPhotoIndex].eventId?.name) || "Personalized Search"}
          userRole={(user.role as any) ?? 'viewer'}
          onDeleteSuccess={(id) => {
            if (lightboxSource === 'myPhotos') {
              setMyPhotos(prev => prev.filter(m => m._id !== id));
            } else {
              setMyUploads(prev => prev.filter(m => m._id !== id));
              setStats(prev => ({ ...prev, totalUploads: Math.max(0, prev.totalUploads - 1) }));
            }
            setSelectedPhotoIndex(null);
          }}
        />
      )}
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
    <div className="bg-slate-50 dark:bg-[#161b22] border border-slate-200 dark:border-[#2d2f45] p-5 rounded-2xl flex flex-col items-center text-center">
      <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1c2e] border border-slate-200 dark:border-[#2d2f45] flex items-center justify-center mb-3 shadow-sm">
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</p>
      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</h4>
    </div>
  );
}
