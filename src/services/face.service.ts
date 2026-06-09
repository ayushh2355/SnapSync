import UserReference from '@/models/UserReference';
import Media from '@/models/Media';

export class FaceService {
  /**
   * Computes the Euclidean distance between two 128-float arrays.
   * Matches face-api.js implementation.
   */
  static euclideanDistance(arr1: number[], arr2: number[]): number {
    if (arr1.length !== arr2.length) {
      throw new Error('Arrays must have the same length');
    }
    let sum = 0;
    for (let i = 0; i < arr1.length; i++) {
      const diff = arr1[i] - arr2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * Compares the target face descriptors found in an image against all users.
   * Returns an array of User IDs that matched.
   */
  static async matchFacesAgainstUsers(targetDescriptors: number[][]): Promise<string[]> {
    if (!targetDescriptors || targetDescriptors.length === 0) return [];

    // Fetch all user references that have a valid faceDescriptor
    const references = await UserReference.find({ 
      faceDescriptor: { $exists: true, $not: { $size: 0 } } 
    }).lean();

    if (!references || references.length === 0) return [];

    const matchedUserIds = new Set<string>();

    for (const ref of references) {
      const userDescriptor = ref.faceDescriptor as number[];
      if (!userDescriptor || userDescriptor.length === 0) continue;

      for (const targetDesc of targetDescriptors) {
        if (!targetDesc || targetDesc.length === 0) continue;
        
        try {
          const distance = FaceService.euclideanDistance(userDescriptor, targetDesc);
          if (distance < 0.6) {
            matchedUserIds.add((ref.userId as any).toString());
            break; // Move to the next reference user
          }
        } catch (e) {
          // ignore dimension mismatches
        }
      }
    }

    return Array.from(matchedUserIds);
  }

  static async detectFaces(buffer: Buffer, mimeType: string = 'image/jpeg'): Promise<number[]> {
    return [1];
  }

  static async findMatchingUsers(faceMetadata: number[]): Promise<string[]> {
    return [];
  }

  static async retroactiveMatchForUser(userId: string) {
    try {
      // Find the user's new descriptor
      const ref = await UserReference.findOne({ userId }).lean();
      if (!ref || !ref.faceDescriptor || (ref.faceDescriptor as number[]).length === 0) return;

      const userDescriptor = ref.faceDescriptor as number[];

      // Find up to 50 recent images that HAVE faceDescriptors populated by the worker
      const recentMedia = await Media.find({ 
        fileType: 'image',
        faceDescriptors: { $exists: true, $not: { $size: 0 } }
      }).sort({ createdAt: -1 }).limit(50);
      
      for (const media of recentMedia) {
        if (!media.faceDescriptors) continue;
        
        let isMatch = false;
        for (const targetDesc of media.faceDescriptors) {
          try {
            if (FaceService.euclideanDistance(userDescriptor, targetDesc) < 0.6) {
              isMatch = true;
              break;
            }
          } catch (e) {}
        }

        if (isMatch) {
          await Media.findByIdAndUpdate(media._id, { 
            $addToSet: { detectedUsers: userId } 
          });
        }
      }
      console.log(`Retroactive matching completed for user ${userId}`);
    } catch (error) {
      console.error('Retroactive matching process failed:', error);
    }
  }
}
