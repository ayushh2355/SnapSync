import { NextRequest, NextResponse } from 'next/server';
import { SocialController } from '@/controllers/social.controller';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await params;
  return SocialController.deleteComment(req, commentId);
}
