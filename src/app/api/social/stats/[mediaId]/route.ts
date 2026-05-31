import { LikeController } from '@/controllers/like.controller';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;
  return LikeController.getMediaStats(req, mediaId);
}
