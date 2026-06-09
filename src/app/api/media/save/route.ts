import { MediaController } from '@/controllers/media.controller';
import { NextRequest } from 'next/server';

export const maxDuration = 60; // Set to max execution time for hobby plan

export async function POST(req: NextRequest) {
  return MediaController.saveMedia(req);
}
