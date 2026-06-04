import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0a0a]">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-blue-500">404</h1>
        <h2 className="text-3xl text-white font-semibold">Page Not Found</h2>
        <p className="text-gray-400 max-w-sm mx-auto">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="pt-4">
          <Link href="/dashboard" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors inline-block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
