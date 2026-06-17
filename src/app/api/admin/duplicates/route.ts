import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Find potential duplicate works by matching work codes or similar titles.
 */
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Find works with the same work code
  const codeDupes = await prisma.work.groupBy({
    by: ['workCode'],
    where: { workCode: { not: null } },
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });

  const duplicateGroups = [];
  for (const group of codeDupes) {
    const works = await prisma.work.findMany({
      where: { workCode: group.workCode },
      include: { circle: true, _count: { select: { tracks: true } } },
    });
    duplicateGroups.push({ reason: 'duplicate_code', code: group.workCode, works });
  }

  // Find works with very similar titles (same first 20 chars)
  const allWorks = await prisma.work.findMany({
    select: { id: true, displayTitle: true, circleId: true },
    orderBy: { displayTitle: 'asc' },
  });

  const titleMap = new Map<string, typeof allWorks>();
  for (const w of allWorks) {
    const key = w.displayTitle.substring(0, 20).toLowerCase();
    if (!titleMap.has(key)) titleMap.set(key, []);
    titleMap.get(key)!.push(w);
  }

  for (const [, works] of titleMap) {
    if (works.length > 1) {
      const fullWorks = await prisma.work.findMany({
        where: { id: { in: works.map((w) => w.id) } },
        include: { circle: true, _count: { select: { tracks: true } } },
      });
      duplicateGroups.push({
        reason: 'similar_title',
        titlePrefix: works[0].displayTitle.substring(0, 20),
        works: fullWorks,
      });
    }
  }

  return NextResponse.json({
    total: duplicateGroups.length,
    groups: duplicateGroups,
  });
}
