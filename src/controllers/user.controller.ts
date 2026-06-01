import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import { S3Service } from '@/services/s3.service';
import { FaceService } from '@/services/face.service';
import UserReference from '@/models/UserReference';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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
        return NextResponse.json({ success: false, error: 'Selfie file is required.' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: 'File exceeds 5MB limit.' }, { status: 400 });
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json({ success: false, error: 'Invalid file type.' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const { url, key } = await S3Service.uploadFile(buffer, file.type, file.name);

      try {
        const faceMetadata = await FaceService.detectFaces(buffer);

        const reference = await UserReference.findOneAndUpdate(
          { userId: user.id },
          { selfieUrl: url, faceMetadata },
          { new: true, upsert: true }
        );

        return NextResponse.json({ success: true, data: reference }, { status: 201 });
      } catch (dbError: unknown) {
        await S3Service.deleteFile(key).catch(console.error);
        throw dbError;
      }
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 });
    }
  }
}
