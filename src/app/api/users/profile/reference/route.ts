import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import UserReference from '@/models/UserReference';
import { S3Service } from '@/services/s3.service';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url, key } = await S3Service.uploadFile(buffer, file.type, `selfie-${user.id}-${Date.now()}`);

    const updatedRef = await UserReference.findOneAndUpdate(
      { userId: user.id },
      { selfieUrl: url, selfieKey: key, faceMetadata: [] },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: updatedRef }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ref = await UserReference.findOne({ userId: user.id }).lean();
    return NextResponse.json({ success: true, data: ref || null }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
