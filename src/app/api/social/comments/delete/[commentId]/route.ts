import { CommentController } from '@/controllers/comment.controller';
import { NextRequest } from 'next/server';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  const { commentId } = await params;
  return CommentController.deleteComment(req, commentId);
}
