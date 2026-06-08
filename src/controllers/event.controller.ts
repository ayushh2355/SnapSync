import { NextRequest, NextResponse } from 'next/server';
import { EventService } from '@/services/event.service';
import { authenticate, authorize } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';

const ALLOWED_QUERY_KEYS = new Set(['page', 'limit', 'search', 'date', 'sortBy', 'category']);

export class EventController {
  static async getEvents(req: NextRequest) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const query: Record<string, string> = {};
      for (const [key, value] of searchParams.entries()) {
        if (ALLOWED_QUERY_KEYS.has(key)) {
          query[key] = value;
        }
      }

      if (user.role === 'Viewer') {
        query.excludePrivate = 'true';
      }

      const events = await EventService.getEvents(query as any);
      return NextResponse.json({ success: true, data: events }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
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
      const { name, date, description, category, isPrivate } = body;

      if (!name || !date || !category) {
        return NextResponse.json(
          { success: false, error: 'name, date, and category are required' },
          { status: 400 }
        );
      }

      const event = await EventService.createEvent({
        name,
        date,
        description,
        category,
        isPrivate: Boolean(isPrivate),
        createdBy: user!.id,
      });

      return NextResponse.json({ success: true, data: event }, { status: 201 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
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
      if (!event) {
        return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
      }

      if (event.isPrivate && user.role === 'Viewer') {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      return NextResponse.json({ success: true, data: event }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
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
      const { name, date, description, category } = body;

      const event = await EventService.updateEvent(id, { name, date, description, category });
      if (!event) {
        return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: event }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
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
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }
}
