import { CommentController } from '@/controllers/comment.controller';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;
  return CommentController.createComment(req, mediaId);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;
  return CommentController.getComments(req, mediaId);
}
