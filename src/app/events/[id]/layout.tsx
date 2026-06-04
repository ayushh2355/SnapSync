import type { Metadata } from 'next';
import connectToDatabase from '@/lib/db';
import Event from '@/models/Event';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    await connectToDatabase();
    const event = await Event.findById(id).lean<{ name?: string, description?: string }>();
    
    if (!event) {
      return {
        title: 'Event Not Found - SnapSync',
      };
    }

    const title = `${event.name} - SnapSync Gallery`;
    const description = event.description || `View the media gallery for ${event.name} on SnapSync.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'SnapSync Event Gallery',
    };
  }
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
