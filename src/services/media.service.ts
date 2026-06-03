import Media from '@/models/Media';

export class MediaService {
  static async createMediaRecord(data: {
    eventId: string;
    uploadedBy: string;
    fileUrl: string;
    fileType: 'image' | 'video';
    accessType?: 'public' | 'private';
    tags?: string[];
    detectedUsers?: string[];
    hash: string;
  }) {
    const media = await Media.create(data);
    return media;
  }

  static async checkDuplicate(eventId: string, hash: string): Promise<boolean> {
    const existing = await Media.findOne({ eventId, hash });
    return !!existing;
  }

  static async getMediaForEvent(eventId: string, includePrivate: boolean) {
    const query: Record<string, unknown> = { eventId };
    
    if (!includePrivate) {
      query.accessType = 'public';
    }

    return await Media.find(query).sort('-createdAt');
  }
}
