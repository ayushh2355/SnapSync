import { EventController } from '@/controllers/event.controller';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return EventController.getEvents(req);
}

export async function POST(req: NextRequest) {
  return EventController.createEvent(req);
}
