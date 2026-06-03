import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import { SharingService } from '@/services/sharing.service';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';

export class SharingController {
  static async generateShareLink(req: NextRequest, eventId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!user || !['Admin', 'Photographer', 'Club Member'].includes(user.role)) {
        return NextResponse.json({ success: false, error: 'Unauthorized to generate share link' }, { status: 403 });
      }

      const event = await Event.findById(eventId);
      if (!event) {
        return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
      }

      const token = SharingService.generateShareToken(eventId);
      const url = new URL(req.url);
      const shareUrl = `${url.origin}/events/${eventId}?shareToken=${token}`;

      return NextResponse.json({ success: true, data: { token, shareUrl } }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  }
}
