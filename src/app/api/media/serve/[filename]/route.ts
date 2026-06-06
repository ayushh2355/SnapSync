import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    
    // Security: Validate filename to prevent path traversal
    if (!filename || filename.includes('/') || filename.includes('..')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'storage', 'media', filename);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);

    // Determine content type
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'png') contentType = 'image/png';
    else if (ext === 'webp') contentType = 'image/webp';
    else if (ext === 'mp4') contentType = 'video/mp4';

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=86400');

    return new NextResponse(buffer, { status: 200, headers });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
