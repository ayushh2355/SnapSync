import { MediaController } from '@/controllers/media.controller';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  return MediaController.uploadMedia(req);
}
