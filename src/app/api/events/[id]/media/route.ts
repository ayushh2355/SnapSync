import { MediaController } from '@/controllers/media.controller';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return MediaController.getEventMedia(req, id);
}
