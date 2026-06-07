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
        console.error('Failed to upload', file.name, err);
        failCount++;
      }
    }

    setIsUploading(false);

    if (failCount === 0) {
      toast({
        title: 'Success',
        description: `Successfully uploaded ${successCount} file(s)!`,
      });
    } else {
      toast({
        title: 'Upload Complete with Errors',
        description: `Uploaded ${successCount} file(s). ${failCount} failed (duplicates or too large).`,
        variant: failCount === files.length ? 'destructive' : 'default',
      });
    }

    onUploadSuccess();
    setFiles([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Media">
      <div className="space-y-4">
        <div 
          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={48} className="text-gray-500 mb-4" />
          <p className="text-white font-medium mb-1">Click or drag files to this area to upload</p>
          <p className="text-gray-400 text-sm">Support for multiple images or video files.</p>
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
              <div key={i} className="p-3 border border-gray-700 rounded-lg flex items-center justify-between bg-gray-800/50">
                <div className="truncate flex-1 pr-4">
                  <p className="text-white font-medium text-sm truncate">{f.name}</p>
                  <p className="text-gray-400 text-xs">{(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <button 
                  onClick={() => setFiles(files.filter((_, index) => index !== i))} 
                  disabled={isUploading}
                  className="text-red-400 hover:text-red-300 text-xs font-semibold uppercase tracking-wider"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={files.length === 0 || isUploading} isLoading={isUploading}>
            Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : 'Files'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
