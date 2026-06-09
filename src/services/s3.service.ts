import { v2 as cloudinary } from 'cloudinary';

function initCloudinary() {
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

export class S3Service {
  static async uploadFile(buffer: Buffer, mimeType: string, originalName: string): Promise<{ url: string; key: string }> {
    initCloudinary();
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: mimeType.startsWith('video/') ? 'video' : 'image',
          folder: 'snapsync',
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary upload failed'));
          resolve({ url: result.secure_url, key: result.public_id });
        }
      );
      uploadStream.end(buffer);
    });
  }

  static async deleteFile(key: string): Promise<void> {
    if (!key) return;
    initCloudinary();
    try {
      await cloudinary.uploader.destroy(key);
    } catch (err) {
      console.error(`Cloudinary delete failed for key ${key}:`, err);
    }
  }

  static async getFileBuffer(key: string): Promise<Buffer> {
    initCloudinary();
    try {
      const url = cloudinary.url(key, { secure: true });
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch from Cloudinary: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      console.error(`Cloudinary getFileBuffer failed for key ${key}:`, err);
      throw err;
    }
  }
}
