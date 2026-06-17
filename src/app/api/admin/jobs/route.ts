import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [importJobs, metadataJobs, workCount, trackCount, circleCount] = await Promise.all([
    prisma.importJob.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.metadataJob.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.work.count(),
    prisma.track.count(),
    prisma.circle.count(),
  ]);

  return NextResponse.json({
    stats: { works: workCount, tracks: trackCount, circles: circleCount },
    importJobs,
    metadataJobs,
  });
}
