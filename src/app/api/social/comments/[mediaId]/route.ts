import { NextRequest, NextResponse } from 'next/server';
import { SocialController } from '@/controllers/social.controller';

export async function POST(req: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;
  return SocialController.createComment(req, mediaId);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;
  return SocialController.getComments(req, mediaId);
}
