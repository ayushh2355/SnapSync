import { NextRequest } from 'next/server';
import { RoleRequestController } from '@/controllers/roleRequest.controller';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  return RoleRequestController.updateRequestStatus(req, requestId);
}
