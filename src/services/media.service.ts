import Media from '@/models/Media';

interface CreateMediaData {
  eventId: string;
  uploadedBy: string;
  fileUrl: string;
  s3Key: string;
  mimeType: string;
  fileType: 'image' | 'video';
  accessType?: 'public' | 'private';
  tags?: string[];
  detectedUsers?: string[];
  faceDescriptors?: number[][];
  hash: string;
}

export class MediaService {
  static async createMediaRecord(data: CreateMediaData) {
    return Media.create(data);
  }

  static async checkDuplicate(eventId: string, hash: string): Promise<boolean> {
    return !!(await Media.exists({ eventId, hash }));
  }

  static async getMediaForEvent(
    eventId: string,
    includePrivate: boolean,
    limit = 50,
    skip = 0
  ) {
    const query: Record<string, unknown> = { eventId };

    if (!includePrivate) {
      query.accessType = 'public';
    }

    return Media.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }
  static async getMediaById(mediaId: string) {
    return Media.findById(mediaId).lean();
  }

  static async deleteMediaRecord(mediaId: string) {
    return Media.findByIdAndDelete(mediaId);
  }
}
