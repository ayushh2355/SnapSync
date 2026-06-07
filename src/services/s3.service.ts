import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';

const USE_S3 = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

const s3Client = USE_S3
  ? new S3Client({
      region: process.env.AWS_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

if (USE_S3 && !process.env.AWS_S3_BUCKET_NAME) {
  throw new Error('AWS_S3_BUCKET_NAME is not defined in environment variables');
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME ?? '';
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'storage', 'media');

export class S3Service {
  static async uploadFile(buffer: Buffer, mimeType: string, originalName: string) {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(originalName) || '.bin';
    const key = `media/${Date.now()}-${uniqueId}${ext}`;

    if (USE_S3 && s3Client) {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        })
      );

      const region = process.env.AWS_REGION ?? 'us-east-1';
      const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
      return { url, key };
    }

    await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
    const filename = path.basename(key);
    await fs.writeFile(path.join(LOCAL_STORAGE_DIR, filename), buffer);

    return { url: `/api/media/serve/${filename}`, key };
  }

  static async deleteFile(key: string): Promise<void> {
    if (USE_S3 && s3Client) {
      await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
      return;
    }

    const filePath = path.join(LOCAL_STORAGE_DIR, path.basename(key));
    await fs.unlink(filePath).catch((err) => {
      if (err.code !== 'ENOENT') throw err;
    });
  }

  static async getFileBuffer(key: string): Promise<Buffer> {
    if (USE_S3 && s3Client) {
      const response = await s3Client.send(
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
      );

      if (!response.Body) {
        throw new Error('S3 response body is empty');
      }

      return Buffer.from(await response.Body.transformToByteArray());
    }

    const filePath = path.join(LOCAL_STORAGE_DIR, path.basename(key));

    try {
      return await fs.readFile(filePath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${key}`);
      }
      throw err;
    }
  }
}
