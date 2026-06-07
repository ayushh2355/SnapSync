import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const currentUser = await authenticate(req);
    
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const users = await User.find({
      name: { $regex: query, $options: 'i' }
    })
      .select('name email role')
      .limit(10);

    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
