import { AnalyticsController } from '@/controllers/analytics.controller';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return AnalyticsController.getEventStats(req, id);
}
