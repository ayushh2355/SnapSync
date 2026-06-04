'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Global Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0a0a0a]">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-red-500">Oops!</h1>
        <h2 className="text-2xl text-white">Something went wrong.</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          We encountered an unexpected error. Please try again, or return to the dashboard if the problem persists.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button onClick={() => reset()} variant="secondary">
            Try Again
          </Button>
          <Button onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
