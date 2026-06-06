import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const useAwsS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = useAwsS3 ? new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
}) : null;

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'snapsync-media';
const LOCAL_STORAGE_DIR = path.join(process.cwd(), 'storage', 'media');

export class S3Service {
  /**
   * Uploads a file buffer to AWS S3.
   * @returns An object containing the S3 URL and the file Key.
   */
  static async uploadFile(buffer: Buffer, mimetype: string, originalName: string) {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const extension = originalName.split('.').pop() || 'bin';
    const key = `media/${Date.now()}-${uniqueId}.${extension}`;

    if (useAwsS3 && s3Client) {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      });

      await s3Client.send(command);

      const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
      return { url, key };
    } else {
      if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
        fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
      }
      const filename = key.replace('media/', '');
      const filePath = path.join(LOCAL_STORAGE_DIR, filename);
      fs.writeFileSync(filePath, buffer);

      const url = `/api/media/serve/${filename}`;
      return { url, key };
    }
  }

  static async deleteFile(key: string) {
    if (useAwsS3 && s3Client) {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });
      await s3Client.send(command);
    } else {
      const filename = key.replace('media/', '');
      const filePath = path.join(LOCAL_STORAGE_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  static async getFileBuffer(key: string): Promise<Buffer> {
    if (useAwsS3 && s3Client) {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('S3 file body is empty');
      }

      const bytes = await response.Body.transformToByteArray();
      return Buffer.from(bytes);
    } else {
      const filename = key.replace('media/', '');
      const filePath = path.join(LOCAL_STORAGE_DIR, filename);
      if (!fs.existsSync(filePath)) {
        throw new Error('Local file not found');
      }
      return fs.readFileSync(filePath);
    }
  }
}
