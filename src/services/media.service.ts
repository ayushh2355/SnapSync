import Media from '@/models/Media';

export class MediaService {
  static async createMediaRecord(data: {
    eventId: string;
    uploadedBy: string;
    fileUrl: string;
    fileType: 'image' | 'video';
    accessType?: 'public' | 'private';
    tags?: string[];
  }) {
    const media = await Media.create(data);
    return media;
  }
}
