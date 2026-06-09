import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { UploadCloud } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';
import { detectAllFaces } from '@/lib/face-api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, eventId, onUploadSuccess }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);

    try {
      const signRes = await apiClient('/api/media/sign-upload');
      if (!signRes.success) throw new Error('Failed to get upload signature');
      const { timestamp, signature, cloudName, apiKey, folder } = signRes.data;

      const results = await Promise.allSettled(
        Array.from(files).map(async (file) => {
          let descriptors: number[][] = [];
          
          if (file.type.startsWith('image/')) {
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
            if (ctx) ctx.drawImage(img, 0, 0, width, height);
            
            const detections = await detectAllFaces(canvas);
            descriptors = detections.map((d: any) => Array.from(d.descriptor));
            URL.revokeObjectURL(objectUrl);
          }

          const uploadData = new FormData();
          uploadData.append('file', file);
          uploadData.append('api_key', apiKey);
          uploadData.append('timestamp', timestamp.toString());
          uploadData.append('signature', signature);
          uploadData.append('folder', folder);

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
            method: 'POST',
            body: uploadData
          });
          const uploadResult = await uploadRes.json();
          if (uploadResult.error) throw new Error(uploadResult.error.message);

          const saveReq = {
            eventId,
            accessType: 'public',
            fileUrl: uploadResult.secure_url,
            s3Key: uploadResult.public_id,
            mimeType: file.type,
            fileType: file.type.startsWith('image/') ? 'image' : 'video',
            faceDescriptors: JSON.stringify(descriptors)
          };

          const saveRes = await apiClient('/api/media/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saveReq)
          });
          
          if (!saveRes.success) throw new Error(saveRes.error || 'Failed to save to database');
          return { file, result: saveRes };
        })
      );

      let successCount = 0;
      let duplicateCount = 0;
      let failCount = 0;

      for (const outcome of results) {
        if (outcome.status === 'fulfilled') {
          successCount++;
        } else {
          const message = (outcome.reason as Error).message ?? '';
          if (message.toLowerCase().includes('duplicate')) {
            duplicateCount++;
            toast({
              title: 'Duplicate Photo',
              description: `A photo already exists in this event and was skipped.`,
              variant: 'destructive',
            });
          } else {
            failCount++;
            toast({
              title: 'Upload Failed',
              description: `A file could not be uploaded. Error: ${message}`,
              variant: 'destructive',
            });
          }
        }
      }

      setIsUploading(false);

      if (successCount > 0) {
        toast({
          title: 'Upload Complete',
          description: `Successfully uploaded ${successCount} file${successCount !== 1 ? 's' : ''}.`,
        });
      }

      if (successCount > 0 || duplicateCount > 0 || failCount > 0) {
        onUploadSuccess();
      }
      setFiles([]);
      onClose();

    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Media">
      <div className="space-y-4">
        <div 
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragging ? 'border-fuchsia-400 bg-fuchsia-50/50 shadow-inner' : 'border-slate-300 hover:border-fuchsia-300 hover:bg-slate-50/50 hover:shadow-sm bg-white/40'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={48} className="text-fuchsia-500 mb-4 drop-shadow-sm" />
          <p className="text-slate-900 font-bold mb-1 tracking-tight">Click or drag files to this area to upload</p>
          <p className="text-slate-500 text-sm font-medium">Support for multiple images or video files.</p>
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            multiple
          />
        </div>

        {files.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
            {files.map((f, i) => (
              <div key={i} className="p-3 border border-slate-200/80 rounded-xl flex items-center justify-between bg-white shadow-sm">
                <div className="truncate flex-1 pr-4">
                  <p className="text-slate-900 font-semibold text-sm truncate">{f.name}</p>
                  <p className="text-slate-500 text-xs font-medium">{(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <button 
                  onClick={() => setFiles(files.filter((_, index) => index !== i))} 
                  disabled={isUploading}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/60 mt-2">
          <Button variant="ghost" onClick={onClose} disabled={isUploading} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-semibold rounded-xl">Cancel</Button>
          <Button onClick={handleUpload} disabled={files.length === 0 || isUploading} isLoading={isUploading} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white border-none shadow-[0_8px_20px_rgba(217,70,239,0.3)] rounded-xl px-6">
            Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
