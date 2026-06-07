import { GoogleGenAI } from '@google/genai';

const FALLBACK_TAGS = ['media', 'event'];

const MIME_TYPE_MAP: Record<string, string> = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
};

function safeParseTags(text: string): string[] {
  try {
    const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return FALLBACK_TAGS;
    return parsed
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.toLowerCase().trim())
      .filter(Boolean);
  } catch {
    return FALLBACK_TAGS;
  }
}

export class VisionService {
  static async generateTags(buffer: Buffer, mimeType = 'image/jpeg'): Promise<string[]> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set, skipping AI tag generation');
      return FALLBACK_TAGS;
    }

    const resolvedMime = MIME_TYPE_MAP[mimeType] ?? 'image/jpeg';

    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Analyze this image and return a JSON array of up to 10 descriptive single-word tags. Return ONLY the raw JSON array with no markdown formatting.',
              },
              {
                inlineData: {
                  mimeType: resolvedMime,
                  data: buffer.toString('base64'),
                },
              },
            ],
          },
        ],
      });

      return safeParseTags(response.text ?? '[]');
    } catch (error) {
      console.error('VisionService.generateTags failed:', error);
      return FALLBACK_TAGS;
    }
  }
}
