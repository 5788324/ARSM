import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const circle = url.searchParams.get('circle') || '';
  const tag = url.searchParams.get('tag') || '';
  const va = url.searchParams.get('va') || '';
  const sort = url.searchParams.get('sort') || 'updatedAt';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '24', 10), 100);

  const where: Prisma.WorkWhereInput = {};

  if (q) {
    where.OR = [
      { displayTitle: { contains: q } },
      { originalTitle: { contains: q } },
      { workCode: { contains: q } },
      { description: { contains: q } },
    ];
  }

  if (circle) {
    where.circle = { name: { contains: circle } };
  }

  if (tag) {
    where.workTags = { some: { tag: { name: { contains: tag } } } };
  }

  if (va) {
    where.workVAs = { some: { voiceActor: { name: { contains: va } } } };
  }

  const orderBy: Prisma.WorkOrderByWithRelationInput =
    sort === 'title'
      ? { displayTitle: 'asc' }
      : sort === 'releaseDate'
        ? { releaseDate: 'desc' }
        : sort === 'createdAt'
          ? { createdAt: 'desc' }
          : { updatedAt: 'desc' };

  const [works, total] = await Promise.all([
    prisma.work.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        circle: true,
        _count: { select: { tracks: true } },
      },
    }),
    prisma.work.count({ where }),
  ]);

  // Get filter options from database for the sidebar
  const [circles, tags, voiceActors] = await Promise.all([
    prisma.circle.findMany({ orderBy: { name: 'asc' }, take: 50 }),
    prisma.tag.findMany({ orderBy: { name: 'asc' }, take: 50 }),
    prisma.voiceActor.findMany({ orderBy: { name: 'asc' }, take: 50 }),
  ]);

  return NextResponse.json({
    works,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    filters: {
      circles,
      tags,
      voiceActors,
    },
  });
}
