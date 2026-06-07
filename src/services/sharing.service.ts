import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET;

export class SharingService {
  static generateShareToken(eventId: string): string {
    return jwt.sign({ eventId }, JWT_SECRET, { expiresIn: '24h' });
  }

  static verifyShareToken(token: string): string | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { eventId: string };
      return decoded.eventId;
    } catch {
      return null;
    }
  }
}
