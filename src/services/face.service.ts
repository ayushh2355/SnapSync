import UserReference from '@/models/UserReference';

export class FaceService {
  static async detectFaces(buffer: Buffer): Promise<number[]> {
    const size = buffer.length;
    const mockMetadata = [
      size % 100,
      (size * 2) % 100,
      (size * 3) % 100,
      (size * 4) % 100,
    ];
    return mockMetadata;
  }

  static async findMatchingUsers(faceMetadata: number[]): Promise<string[]> {
    if (!faceMetadata || faceMetadata.length === 0) return [];

    const references = await UserReference.find();
    const matchedUserIds: string[] = [];

    for (const ref of references) {
      if (ref.faceMetadata && ref.faceMetadata.length > 0) {
        let diff = 0;
        for (let i = 0; i < Math.min(faceMetadata.length, ref.faceMetadata.length); i++) {
          diff += Math.abs(faceMetadata[i] - ref.faceMetadata[i]);
        }
        
        if (diff < 50) {
          matchedUserIds.push(ref.userId.toString());
        }
      }
    }

    return matchedUserIds;
  }
}
