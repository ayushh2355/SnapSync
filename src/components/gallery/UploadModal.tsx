import React, { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { UploadCloud } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, eventId, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('eventId', eventId);
    formData.append('accessType', 'public'); // Default for now

    try {
      await apiClient('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      
      onUploadSuccess();
      setFile(null);
      onClose();
    } catch (err: unknown) {
      const msg = (err as Error).message;
      setError(msg.includes('Duplicate media') ? 'This image is a duplicate and has already been uploaded to this event.' : msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Media">
      <div className="space-y-4">
        {error && <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md text-red-500 text-sm text-center">{error}</div>}
        
        {!file ? (
          <div 
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud size={48} className="text-gray-500 mb-4" />
            <p className="text-white font-medium mb-1">Click or drag file to this area to upload</p>
            <p className="text-gray-400 text-sm">Support for a single image or video file.</p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            />
          </div>
        ) : (
          <div className="p-4 border border-gray-700 rounded-xl flex items-center justify-between bg-gray-800/50">
            <div className="truncate flex-1 pr-4">
              <p className="text-white font-medium truncate">{file.name}</p>
              <p className="text-gray-400 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <button 
              onClick={() => setFile(null)} 
              disabled={isUploading}
              className="text-gray-400 hover:text-white text-sm"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || isUploading} isLoading={isUploading}>
            Upload File
          </Button>
        </div>
      </div>
    </Modal>
  );
};
