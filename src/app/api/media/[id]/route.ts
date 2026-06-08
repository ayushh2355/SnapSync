import { NextRequest } from 'next/server';
import { MediaController } from '@/controllers/media.controller';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return MediaController.deleteMedia(req, id);
}
