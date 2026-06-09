import { NextRequest } from 'next/server';
import { authenticate } from '@/middlewares/auth';
import connectToDatabase from '@/lib/db';
import { NotificationService } from '@/services/notification.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const user = await authenticate(req);

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const unsubscribe = NotificationService.subscribe(user.id, (event) => {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        });

        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        }, 15000);

        req.signal.addEventListener('abort', () => {
          clearInterval(keepAlive);
          unsubscribe();
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
