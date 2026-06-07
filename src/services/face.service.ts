import UserReference from '@/models/UserReference';

const MATCH_THRESHOLD = 50;
const FACE_VECTOR_LENGTH = 4;

export class FaceService {
  static async detectFaces(buffer: Buffer): Promise<number[]> {
    const size = buffer.length;
    return [
      size % 100,
      (size * 2) % 100,
      (size * 3) % 100,
      (size * 4) % 100,
    ];
  }

  static async findMatchingUsers(faceMetadata: number[]): Promise<string[]> {
    if (!faceMetadata || faceMetadata.length === 0) return [];

    const references = await UserReference.find(
      { faceMetadata: { $exists: true, $not: { $size: 0 } } },
      { userId: 1, faceMetadata: { $slice: FACE_VECTOR_LENGTH } }
    ).lean();

    const matchedUserIds: string[] = [];

    for (const ref of references) {
      const refMeta = ref.faceMetadata as number[];
      if (!Array.isArray(refMeta) || refMeta.length === 0) continue;

      let diff = 0;
      const len = Math.min(faceMetadata.length, refMeta.length);
      for (let i = 0; i < len; i++) {
        diff += Math.abs(faceMetadata[i] - refMeta[i]);
      }

      if (diff < MATCH_THRESHOLD) {
        matchedUserIds.push((ref.userId as { toString(): string }).toString());
      }
    }

    return matchedUserIds;
  }
}
