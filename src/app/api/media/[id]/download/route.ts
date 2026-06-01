import { DownloadController } from '@/controllers/download.controller';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return DownloadController.downloadMedia(req, id);
}
