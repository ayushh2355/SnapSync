import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import Favourite from '@/models/Favourite';
import mongoose from 'mongoose';

export async function POST(req: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  try {
    await connectToDatabase();
    const user = await authenticate(req);
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { mediaId } = await params;

    if (!mongoose.Types.ObjectId.isValid(mediaId)) {
      return NextResponse.json({ success: false, error: 'Invalid media ID' }, { status: 400 });
    }

    const existingFavourite = await Favourite.findOne({ mediaId, userId: user.id });

    if (existingFavourite) {
      await Favourite.deleteOne({ _id: existingFavourite._id });
      return NextResponse.json({ success: true, data: { isFavourited: false } }, { status: 200 });
    } else {
      await Favourite.create({ mediaId, userId: user.id });
      return NextResponse.json({ success: true, data: { isFavourited: true } }, { status: 201 });
    }
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
