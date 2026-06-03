import { SharingController } from '@/controllers/sharing.controller';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return SharingController.generateShareLink(req, id);
}
