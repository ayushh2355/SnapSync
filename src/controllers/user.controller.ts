import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import { S3Service } from '@/services/s3.service';
import { FaceService } from '@/services/face.service';
import UserReference from '@/models/UserReference';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class UserController {
  static async uploadSelfie(req: NextRequest) {
    try {
      await connectToDatabase();
      const user = await authenticate(req);

      if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const formData = await req.formData();
      const file = formData.get('selfie') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'Selfie file is required' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: 'File exceeds 5MB limit' }, { status: 400 });
      }

      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      const faceMetadata = await FaceService.detectFaces(buffer);
      if (!faceMetadata || (Array.isArray(faceMetadata) && faceMetadata.length === 0)) {
        return NextResponse.json({ success: false, error: 'No face detected in the uploaded image' }, { status: 422 });
      }

      const { url, key } = await S3Service.uploadFile(buffer, file.type, file.name);

      try {
        const reference = await UserReference.findOneAndUpdate(
          { userId: user.id },
          { selfieUrl: url, faceMetadata },
          { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, data: reference }, { status: 201 });
      } catch (dbError: unknown) {
        S3Service.deleteFile(key).catch((cleanupErr) => {
          console.error(`S3 cleanup failed for key ${key}:`, cleanupErr);
        });
        throw dbError;
      }
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
  }
}
