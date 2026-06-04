import React from 'react';

export default function EventGalleryLoading() {
  const heights = [200, 350, 150, 400, 250, 300, 180, 280];

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-gray-800 rounded mb-6"></div>
          <div className="h-8 w-64 bg-gray-800 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-800 rounded"></div>
        </div>
      </div>

      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {heights.map((h, i) => (
          <div 
            key={i} 
            className="w-full bg-gray-800 rounded-xl animate-pulse"
            style={{ height: `${h}px` }}
          ></div>
        ))}
      </div>
    </div>
  );
}
