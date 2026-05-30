import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import connectToDatabase from '@/lib/db';

export class AuthController {
  static async register(req: NextRequest) {
    try {
      await connectToDatabase();
      const body = await req.json();
      const user = await AuthService.register(body);
      
      return NextResponse.json(
        { success: true, data: user },
        { status: 201 }
      );
    } catch (error: unknown) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: 400 }
      );
    }
  }

  static async login(req: NextRequest) {
    try {
      await connectToDatabase();
      const body = await req.json();
      const result = await AuthService.login(body);
      
      return NextResponse.json(
        { success: true, data: result },
        { status: 200 }
      );
    } catch (error: unknown) {
      return NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: 400 }
      );
    }
  }
}
