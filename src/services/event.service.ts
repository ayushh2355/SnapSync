import Event from '@/models/Event';

export class EventService {

  static async createEvent(data: any) {
    const event = await Event.create(data);
    return event;
  }

  static async getEvents(query: any = {}) {
    const { name, category, date, sort } = query;
    
    const filter: any = {};

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    if (category) {
      filter.category = category;
    }
    if (date) {
      filter.date = { $gte: new Date(date) };
    }

    let queryBuilder = Event.find(filter);

    if (sort) {

      const sortBy = sort.split(',').join(' ');
      queryBuilder = queryBuilder.sort(sortBy);
    } else {
      queryBuilder = queryBuilder.sort('-createdAt');
    }

    const events = await queryBuilder.exec();
    return events;
  }

  static async getEventById(id: string) {
    const event = await Event.findById(id);
    if (!event) {
      throw new Error('Event not found');
    }
    return event;
  }

  static async updateEvent(id: string, data: any) {
    const event = await Event.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!event) {
      throw new Error('Event not found');
    }
    return event;
  }

  static async deleteEvent(id: string) {
    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      throw new Error('Event not found');
    }
    return event;
  }
}
