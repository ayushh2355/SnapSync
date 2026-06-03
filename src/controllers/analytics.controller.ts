import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { AnalyticsService } from '@/services/analytics.service';

export class AnalyticsController {
  static async getEventStats(req: NextRequest, eventId: string) {
    try {
      await connectToDatabase();
      const stats = await AnalyticsService.getEventStats(eventId);
      return NextResponse.json({ success: true, data: stats }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  }
}
