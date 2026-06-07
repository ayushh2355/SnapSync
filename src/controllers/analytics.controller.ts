import { NextRequest, NextResponse } from 'next/server';
import { authenticate, authorize } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import { AnalyticsService } from '@/services/analytics.service';

export class AnalyticsController {
  static async getEventStats(req: NextRequest, eventId: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!authorize(user, ['Admin', 'Photographer'])) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const stats = await AnalyticsService.getEventStats(eventId);
      return NextResponse.json({ success: true, data: stats }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }
}
