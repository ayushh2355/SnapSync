import { EventController } from '@/controllers/event.controller';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return EventController.getEvents(req);
}

export async function POST(req: NextRequest) {
  return EventController.createEvent(req);
}
