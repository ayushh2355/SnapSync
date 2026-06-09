import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const user = await authenticate(req);
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const RoleRequest = (await import('@/models/RoleRequest')).default;
    const pendingReq = await RoleRequest.findOne({ userId: user.id }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ 
      success: true, 
      data: { 
        id: user.id,
        name: user.name, 
        email: user.email, 
        role: user.role,
        roleRequest: pendingReq ? {
          requestedRole: pendingReq.requestedRole,
          status: pendingReq.status
        } : null
      } 
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
