import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';

interface Media {
  _id: string;
  fileUrl: string;
  tags: string[];
  likesCount?: number;
  commentsCount?: number;
}

interface ImageGridProps {
  mediaList: Media[];
}

export const ImageGrid: React.FC<ImageGridProps> = ({ mediaList }) => {
  if (mediaList.length === 0) {
    return (
      <div className="text-gray-400 text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
        No media uploaded yet.
      </div>
    );
  }

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
      {mediaList.map((media) => (
        <div key={media._id} className="relative group break-inside-avoid overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={media.fileUrl} 
            alt="Event media" 
            className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            <div className="flex gap-4 mb-2 text-white">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Heart size={16} className="text-red-500 fill-red-500" /> {media.likesCount || 0}
              </span>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <MessageCircle size={16} className="text-blue-500" /> {media.commentsCount || 0}
              </span>
            </div>
            {media.tags && media.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {media.tags.map(tag => (
                  <span key={tag} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-md">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
