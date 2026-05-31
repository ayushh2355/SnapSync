import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'snapsync-media';

export class S3Service {
  /**
   * Uploads a file buffer to AWS S3.
   * @returns An object containing the S3 URL and the file Key.
   */
  static async uploadFile(buffer: Buffer, mimetype: string, originalName: string) {
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const extension = originalName.split('.').pop();
    const key = `media/${Date.now()}-${uniqueId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    await s3Client.send(command);

    // Assuming the bucket allows public read or we return the format
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    return { url, key };
  }

  /**
   * Deletes a file from AWS S3. Used for rollback.
   */
  static async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }
}
