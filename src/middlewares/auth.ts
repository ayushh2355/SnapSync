import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectToDatabase from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export interface AuthUser {
  id: string;
  role: string;
}

export async function authenticate(req: NextRequest): Promise<AuthUser | null> {
  await connectToDatabase();
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      role: user.role,
    };
  } catch (error) {
    console.error('JWT Verification Failed:', error);
    return null;
  }
}

export function authorize(user: AuthUser | null, roles: string[]): boolean {
  if (!user) return false;
  if (!roles.includes(user.role)) return false;
  return true;
}
