import { promises as fs } from 'fs';
import path from 'path';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];

export async function processLocalUpload(file: File): Promise<string> {
  // 1. Validate Size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds the 10MB limit.');
  }

  // 2. Validate Type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only images and videos are allowed.');
  }

  // 3. Save Locally (Simulating cloud upload for now)
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Ensure directory exists
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = path.extname(file.name) || (file.type.startsWith('image') ? '.jpg' : '.mp4');
  const filename = `${uniqueSuffix}${ext}`;
  const filepath = path.join(uploadDir, filename);

  await fs.writeFile(filepath, buffer);

  // Return the public URL path
  return `/uploads/${filename}`;
}
