import Event from '@/models/Event';
import Media from '@/models/Media';

const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'name', 'date', 'category']);

interface EventQueryParams {
  name?: string;
  category?: string;
  date?: string;
  sort?: string;
  limit?: number;
  skip?: number;
  excludePrivate?: boolean;
}

interface CreateEventData {
  name: string;
  date: string;
  category: string;
  description?: string;
  isPrivate?: boolean;
  createdBy: string;
}

interface UpdateEventData {
  name?: string;
  date?: string;
  description?: string;
  category?: string;
}

export class EventService {
  static async createEvent(data: CreateEventData) {
    return Event.create(data);
  }

  static async getEvents(params: EventQueryParams = {}) {
    const { name, category, date, sort, limit = 20, skip = 0 } = params;
    const filter: Record<string, unknown> = {};

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    if (params.excludePrivate) {
      filter.isPrivate = { $ne: true };
    }
    if (category) {
      filter.category = category;
    }
    if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        filter.date = { $gte: parsed };
      }
    }

    const sortObj: Record<string, 1 | -1> = {};
    if (sort) {
      for (const field of sort.split(',')) {
        const clean = field.trim().replace(/^-/, '');
        if (ALLOWED_SORT_FIELDS.has(clean)) {
          sortObj[clean] = field.startsWith('-') ? -1 : 1;
        }
      }
    }

    if (Object.keys(sortObj).length === 0) {
      sortObj.createdAt = -1;
    }

    const events = await Event.find(filter)
      .sort(sortObj)
      .limit(Math.min(limit, 100))
      .skip(Math.max(skip, 0))
      .lean();

    // Fetch the first photo for each event to serve as a cover
    const eventsWithCovers = await Promise.all(
      events.map(async (event) => {
        const media = await Media.findOne({ eventId: event._id, fileType: 'image' })
          .sort({ createdAt: 1 })
          .select('fileUrl')
          .lean();
        return {
          ...event,
          coverImage: media ? media.fileUrl : null,
        };
      })
    );

    return eventsWithCovers;
  }

  static async getEventById(id: string) {
    const event = await Event.findById(id).lean();
    if (!event) {
      throw new Error('Event not found');
    }
    return event;
  }

  static async updateEvent(id: string, data: UpdateEventData) {
    const { name, date, description, category } = data;
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (date !== undefined) update.date = date;
    if (description !== undefined) update.description = description;
    if (category !== undefined) update.category = category;

    const event = await Event.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!event) {
      throw new Error('Event not found');
    }
    return event;
  }

  static async deleteEvent(id: string) {
    const event = await Event.findByIdAndDelete(id).lean();
    if (!event) {
      throw new Error('Event not found');
    }
    return event;
  }
}
