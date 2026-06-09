import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import RoleRequest from '@/models/RoleRequest';

import { OAuth2Client } from 'google-auth-library';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}
if (!process.env.AUTH_GOOGLE_ID) {
  throw new Error('AUTH_GOOGLE_ID is not defined in environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET;

function signToken(userId: string, role: string): string {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '1d' });
}

async function buildUserPayload(user: { _id: unknown; name: string; email: string; role: string }) {
  const pendingReq = await RoleRequest.findOne({ userId: user._id }).sort({ createdAt: -1 }).lean();
  
  return {
    id: (user._id as { toString(): string }).toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    roleRequest: pendingReq ? {
      requestedRole: pendingReq.requestedRole,
      status: pendingReq.status
    } : null
  };
}

export class AuthService {
  static async register(data: { name: string; email: string; password: string; role?: string; googleId?: string }) {
    const { name, email, password, role, googleId } = data;

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const assignedRole = email.endsWith('@iitr.ac.in') ? 'Club Member' : 'Viewer';


    const user = await User.create({
      name,
      email,
      password: hashedPassword,
     role: assignedRole,
      googleId,
    });
  const validRoles = ['Admin', 'Photographer', 'Club Member', 'Viewer'];
  if (role && validRoles.includes(role) && role !== assignedRole) {
    const roleReq = await RoleRequest.create({
      userId: user._id,
      requestedRole: role,
      status: 'pending',
    });

    const { NotificationService } = await import('@/services/notification.service');
    const admins = await User.find({ role: 'Admin' }, '_id').lean();
    for (const admin of admins) {
      await NotificationService.createNotification({
        recipientId: admin._id.toString(),
        actorId: user._id.toString(),
        type: 'role_request',
        requestId: roleReq._id.toString(),
      });
    }
  }
    return await buildUserPayload(user);
  }

  static async login(data: { email: string; password: string }) {
    const { email, password } = data;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = signToken(user._id.toString(), user.role);
    return { token, user: await buildUserPayload(user) };
  }

  static async googleLogin(idToken: string) {
    const clientId = process.env.AUTH_GOOGLE_ID;
    const client = new OAuth2Client(clientId);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload?.name) {
      throw new Error('Invalid Google token payload');
    }

    const { email, name, sub: googleId } = payload;

    const user = await User.findOne({ email });

    if (!user) {

      return { isNewUser: true, email, name, googleId };
    }

    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = signToken(user._id.toString(), user.role);
    return { token, user: await buildUserPayload(user) };
  }
}
