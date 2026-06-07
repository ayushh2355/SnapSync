import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
]);

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function processLocalUpload(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds the 10MB limit');
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || MIME_TO_EXT[file.type];
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(filepath, buffer);

  return `/uploads/${filename}`;
}
