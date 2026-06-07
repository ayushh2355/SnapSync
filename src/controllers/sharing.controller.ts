import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import { SharingService } from '@/services/sharing.service';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';

const PRIVILEGED_ROLES = new Set(['Admin', 'Photographer', 'Club Member']);

export class SharingController {
  static async generateShareLink(req: NextRequest, eventId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!user || !PRIVILEGED_ROLES.has(user.role)) {
        return NextResponse.json({ success: false, error: 'Unauthorized to generate share link' }, { status: 403 });
      }

      const event = await Event.findById(eventId).lean();
      if (!event) {
        return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!appUrl) {
        throw new Error('NEXT_PUBLIC_APP_URL is not defined in environment variables');
      }

      const token = SharingService.generateShareToken(eventId);
      const shareUrl = `${appUrl}/events/${eventId}?shareToken=${token}`;

      return NextResponse.json({ success: true, data: { token, shareUrl } }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }
}
