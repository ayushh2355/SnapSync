import { UserController } from '@/controllers/user.controller';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  return UserController.uploadSelfie(req);
}
