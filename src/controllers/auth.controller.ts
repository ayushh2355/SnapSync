import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import connectToDatabase from '@/lib/db';

const GENERIC_AUTH_ERROR = 'Invalid credentials';

export class AuthController {
  static async register(req: NextRequest) {
    try {
      await connectToDatabase();
      const body = await req.json();
      const { name, email, password, role } = body;

      if (!name || !email || !password) {
        return NextResponse.json(
          { success: false, error: 'name, email, and password are required' },
          { status: 400 }
        );
      }

      if (typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 400 });
      }

      if (typeof password !== 'string' || password.length < 8) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }

      const user = await AuthService.register({ name, email, password, role });
      return NextResponse.json({ success: true, data: user }, { status: 201 });
    } catch (error: unknown) {
      const message = (error as Error).message;
      const isClientError = message.toLowerCase().includes('already exists') || message.toLowerCase().includes('duplicate');
      return NextResponse.json(
        { success: false, error: message },
        { status: isClientError ? 409 : 400 }
      );
    }
  }

  static async login(req: NextRequest) {
    try {
      await connectToDatabase();
      const body = await req.json();
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'email and password are required' },
          { status: 400 }
        );
      }

      const result = await AuthService.login({ email, password });
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: GENERIC_AUTH_ERROR }, { status: 401 });
    }
  }

  static async googleLogin(req: NextRequest) {
    try {
      await connectToDatabase();
      const body = await req.json();
      const { idToken, role } = body;

      if (!idToken || typeof idToken !== 'string') {
        return NextResponse.json({ success: false, error: 'Google idToken is required' }, { status: 400 });
      }

      const result = await AuthService.googleLogin(idToken, role);
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    } catch (error: unknown) {
      return NextResponse.json({ success: false, error: GENERIC_AUTH_ERROR }, { status: 401 });
    }
  }
}
