import { NextRequest, NextResponse } from 'next/server';
import { SocialController } from '@/controllers/social.controller';

export async function GET(req: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;
  return SocialController.getMediaStats(req, mediaId);
}
