import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Toggle favorite for a work */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { workId } = await req.json();
  if (!workId) return NextResponse.json({ error: 'workId required' }, { status: 400 });

  const userId = session.user!.id!;

  const existing = await prisma.favorite.findUnique({
    where: { userId_workId: { userId, workId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({ data: { userId, workId } });
  return NextResponse.json({ favorited: true });
}

/** Get favorites for current user */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const checkWorkId = url.searchParams.get('workId');

  if (checkWorkId) {
    const fav = await prisma.favorite.findUnique({
      where: {
        userId_workId: {
          userId: session.user!.id!,
          workId: checkWorkId,
        },
      },
    });
    return NextResponse.json({ favorited: !!fav });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user!.id! },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      work: {
        include: { circle: true, _count: { select: { tracks: true } } },
      },
    },
  });

  return NextResponse.json(favorites);
}
