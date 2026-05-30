import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/services/event.service';
import { authenticate, authorize } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';

export class EventController {
  static async getEvents(req: NextRequest) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      // Extract query params for filtering/sorting
      const { searchParams } = new URL(req.url);
      const query = Object.fromEntries(searchParams.entries());

      const events = await EventService.getEvents(query);
      return NextResponse.json({ success: true, data: events }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  }

  static async createEvent(req: NextRequest) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);
      if (!authorize(user, ['Admin', 'Photographer'])) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const body = await req.json();
      const event = await EventService.createEvent(body);
      
      return NextResponse.json({ success: true, data: event }, { status: 201 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  }

  static async getEventById(req: NextRequest, id: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);
      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const event = await EventService.getEventById(id);
      return NextResponse.json({ success: true, data: event }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 404 });
    }
  }

  static async updateEvent(req: NextRequest, id: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);
      if (!authorize(user, ['Admin', 'Photographer'])) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      const body = await req.json();
      const event = await EventService.updateEvent(id, body);
      
      return NextResponse.json({ success: true, data: event }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  }

  static async deleteEvent(req: NextRequest, id: string) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);
      if (!authorize(user, ['Admin'])) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      await EventService.deleteEvent(id);
      
      return NextResponse.json({ success: true, data: {} }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  }
}
