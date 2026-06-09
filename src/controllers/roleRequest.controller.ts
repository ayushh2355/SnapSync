import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import { RoleRequestService } from '@/services/roleRequest.service';

export class RoleRequestController {
  static async getPendingRequests(req: NextRequest) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!user || user.role !== 'Admin') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const requests = await RoleRequestService.getPendingRequests();
      return NextResponse.json({ success: true, data: requests }, { status: 200 });
    } catch (error: unknown) {
      console.error('error:', error);
      return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 });
    }
  }

  static async updateRequestStatus(req: NextRequest, requestId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!user || user.role !== 'Admin') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const body = await req.json();
      const { status } = body;

      if (status !== 'approved' && status !== 'rejected') {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }

      const updatedRequest = await RoleRequestService.updateRequestStatus(requestId, status, user.id);
      return NextResponse.json({ success: true, data: updatedRequest }, { status: 200 });
    } catch (error: unknown) {
      console.error('error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      const statusCode = errorMessage === 'Request not found' ? 404 : (errorMessage === 'Request already processed' ? 400 : 500);
      return NextResponse.json({ success: false, error: statusCode === 500 ? 'Something went wrong' : errorMessage }, { status: statusCode });
    }
  }
}
