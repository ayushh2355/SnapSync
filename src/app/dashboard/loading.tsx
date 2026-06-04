import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-800 rounded mb-4"></div>
          <div className="h-4 w-64 bg-gray-800 rounded"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-48 animate-pulse flex flex-col">
            <div className="h-6 w-3/4 bg-gray-800 rounded mb-3"></div>
            <div className="h-3 w-1/4 bg-gray-800 rounded mb-5"></div>
            <div className="h-3 w-full bg-gray-800 rounded mb-2"></div>
            <div className="h-3 w-5/6 bg-gray-800 rounded mb-2"></div>
            <div className="mt-auto pt-4 border-t border-gray-800">
              <div className="h-4 w-24 bg-gray-800 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
