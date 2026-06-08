import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { UploadCloud } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

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

    let successCount = 0;
    let duplicateCount = 0;
    let failCount = 0;

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('eventId', eventId);
      formData.append('accessType', 'public');

      try {
        await apiClient('/api/media/upload', {
          method: 'POST',
          body: formData,
        });
        successCount++;
      } catch (err: unknown) {
        const message = (err as Error).message ?? '';
        if (message.toLowerCase().includes('duplicate')) {
          duplicateCount++;
          toast({
            title: 'Duplicate Photo',
            description: `"${file.name}" already exists in this event and was skipped.`,
            variant: 'destructive',
          });
        } else {
          failCount++;
          toast({
            title: 'Upload Failed',
            description: `"${file.name}" could not be uploaded. It may be too large or an unsupported format.`,
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
