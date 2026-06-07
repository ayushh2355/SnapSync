import { NextRequest, NextResponse } from 'next/server';
import { authenticate, authorize } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import Media from '@/models/Media';
import mongoose from 'mongoose';
import { NotificationService } from '@/services/notification.service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const currentUser = await authenticate(req);
    
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!authorize(currentUser, ['Admin', 'Photographer'])) {
      return NextResponse.json({ success: false, error: 'Forbidden. Only Admins and Photographers can tag users.' }, { status: 403 });
    }

    const { id: mediaId } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(mediaId)) {
      return NextResponse.json({ success: false, error: 'Invalid media ID' }, { status: 400 });
    }

    const body = await req.json();
    const targetUserId = body.userId;

    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    const media = await Media.findById(mediaId);
    if (!media) {
      return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
    }

    if (!media.detectedUsers.includes(targetUserId)) {
      media.detectedUsers.push(targetUserId);
      await media.save();

      await NotificationService.createNotification({
        recipientId: targetUserId,
        actorId: currentUser.id,
        type: 'tag' as any,
        mediaId: mediaId,
      });
    }

  
    await media.populate('detectedUsers', 'name email');

    return NextResponse.json({ success: true, data: media.detectedUsers }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
  }
}
