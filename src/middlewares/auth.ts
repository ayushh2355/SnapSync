import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectToDatabase from '@/lib/db';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthUser {
  id: string;
  role: string;
}

function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return req.cookies.get('token')?.value ?? null;
}

export async function authenticate(req: NextRequest): Promise<AuthUser | null> {
  const token = extractToken(req);

  if (!token) {
    return null;
  }

  let decoded: { id: string };

  try {
    decoded = jwt.verify(token, JWT_SECRET) as { id: string };
  } catch {
    return null;
  }

  try {
    await connectToDatabase();
    const user = await User.findById(decoded.id).lean();

    if (!user) {
      return null;
    }

    return {
      id: (user._id as { toString(): string }).toString(),
      role: (user as { role: string }).role,
    };
  } catch {
    return null;
  }
}

export function authorize(user: AuthUser | null, roles: string[]): boolean {
  return !!user && roles.includes(user.role);
}
