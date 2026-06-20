import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { HomeClient } from './client';

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [recentWorks, recentImports, totalWorks, totalTracks] = await Promise.all([
    prisma.work.findMany({ orderBy: { updatedAt: 'desc' }, take: 6, include: { circle: true, _count: { select: { tracks: true } } } }),
    prisma.acquisitionJob.findMany({ where: { status: { in: ['done', 'review', 'done_with_errors'] } }, orderBy: { finishedAt: 'desc' }, take: 4 }),
    prisma.work.count(),
    prisma.track.count(),
  ]);

  const homeData = {
    recentWorks: JSON.parse(JSON.stringify(recentWorks)),
    recentImports: JSON.parse(JSON.stringify(recentImports)),
    totalWorks, totalTracks,
  };

  return <HomeClient data={homeData} />;
}
