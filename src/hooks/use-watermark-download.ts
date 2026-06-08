'use client';

import { useState, useCallback } from 'react';
import { downloadWithWatermark } from '@/lib/downloadWithWatermark';

type UserRole = 'admin' | 'photographer' | 'member' | 'viewer';

interface UseWatermarkDownloadReturn {
  isDownloading: boolean;
  download: (
    imageUrl: string,
    clubName: string,
    eventName: string,
    userRole: UserRole,
    fileName: string,
  ) => Promise<void>;
}

export function useWatermarkDownload(): UseWatermarkDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = useCallback(
    async (
      imageUrl: string,
      clubName: string,
      eventName: string,
      userRole: UserRole,
      fileName: string,
    ) => {
      setIsDownloading(true);
      try {
        await downloadWithWatermark(imageUrl, clubName, eventName, userRole, fileName);
      } finally {
        setIsDownloading(false);
      }
    },
    [],
  );

  return { isDownloading, download };
}
