import { NextRequest } from 'next/server';
import { RoleRequestController } from '@/controllers/roleRequest.controller';

export async function GET(req: NextRequest) {
  return RoleRequestController.getPendingRequests(req);
}
