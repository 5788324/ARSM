import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import WorkClient from './client';

export default async function WorkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect('/login');
  const { id } = await params;

  const work = await prisma.work.findUnique({
    where: { id },
    include: {
      circle: true,
      tracks: {
        orderBy: { trackNumber: 'asc' },
        include: {
          trackFiles: {
            include: { repository: true },
            orderBy: { sortKey: 'asc' },
          },
        },
      },
      workTags: { include: { tag: true } },
      workVAs: { include: { voiceActor: true } },
      workSources: true,
    },
  });

  // Query subtitles separately
  const subtitles = await (prisma as any).trackSubtitle.findMany({
    where: { workId: id },
    orderBy: { createdAt: 'asc' },
  });

  if (!work) notFound();

  return <WorkClient work={JSON.parse(JSON.stringify({ ...work, trackSubtitles: subtitles }))} />;
}
