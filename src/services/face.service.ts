import UserReference from '@/models/UserReference';
import { S3Service } from '@/services/s3.service';
import { GoogleGenAI } from '@google/genai';

export class FaceService {
  static async detectAndMatchFaces(targetBuffer: Buffer, targetMimeType: string = 'image/jpeg'): Promise<string[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set, skipping face matching');
      return [];
    }

    const references = await UserReference.find({ selfieUrl: { $exists: true } }).lean();
    if (!references || references.length === 0) return [];

    const ai = new GoogleGenAI({ apiKey });
    
    // Construct parts array for Gemini
    // We send each reference image along with a text label identifying the user ID
    const parts: any[] = [];
    
    parts.push({
      text: 'You are a highly accurate facial recognition system. I will provide you with reference images of several people, each labeled with their unique User ID. After the reference images, I will provide a Target Image. Your task is to identify which of the reference people are present in the Target Image. Return ONLY a JSON array of strings containing the User IDs of the matched people. Do not include markdown formatting or explanations. If no one matches, return an empty array [].'
    });

    for (const ref of references) {
      try {
        const refKey = ref.selfieKey || ('media/' + ref.selfieUrl.split('/').pop());
        const refBuffer = await S3Service.getFileBuffer(refKey);
        parts.push({ text: `Reference User ID: ${(ref.userId as any).toString()}` });
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg', // Assume jpeg or let Gemini figure it out
            data: refBuffer.toString('base64'),
          },
        });
      } catch (err) {
        console.error(`Failed to load reference image for user ${ref.userId}:`, err);
      }
    }

    parts.push({ text: 'Target Image:' });
    parts.push({
      inlineData: {
        mimeType: targetMimeType,
        data: targetBuffer.toString('base64'),
      },
    });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts }],
      });

      const text = response.text || '[]';
      const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id): id is string => typeof id === 'string');
    } catch (error) {
      console.error('FaceService.detectAndMatchFaces failed:', error);
      return [];
    }
  }

  // Deprecated dummy methods kept for compatibility temporarily
  static async detectFaces(buffer: Buffer): Promise<number[]> {
    return [];
  }
  static async findMatchingUsers(faceMetadata: number[]): Promise<string[]> {
    return [];
  }
}
