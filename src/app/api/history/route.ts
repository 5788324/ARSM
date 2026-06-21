import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Save or update listening progress */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { workId, trackId, positionSec } = body;

  if (!workId || positionSec === undefined) {
    return NextResponse.json({ error: 'workId and positionSec required' }, { status: 400 });
  }

  const existing = await prisma.listeningHistory.findFirst({
    where: { userId: session.user!.id!, workId },
  });

  if (existing) {
    await prisma.listeningHistory.update({
      where: { id: existing.id },
      data: { trackId, positionSec, listenedAt: new Date() },
    });
  } else {
    await prisma.listeningHistory.create({
      data: {
        userId: session.user!.id!,
        workId,
        trackId,
        positionSec,
      },
    });
  }

  // Also log to PlayLog for cumulative tracking
  // Use deltaSec (incremental) when available, fall back to positionSec
  const listenSec = body.deltaSec !== undefined ? body.deltaSec : body.positionSec || 0;
  await (prisma as any).playLog.create({
    data: { userId: session.user!.id!, workId, listenedSec: listenSec },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}

/** Get listening progress for a work */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const workId = url.searchParams.get('workId');

  if (workId) {
    const history = await prisma.listeningHistory.findFirst({
      where: { userId: session.user!.id!, workId },
    });
    return NextResponse.json(history || null);
  }

  // Return all recent listening history
  const history = await prisma.listeningHistory.findMany({
    where: { userId: session.user!.id! },
    orderBy: { listenedAt: 'desc' },
    take: 20,
    include: {
      work: {
        select: { id: true, displayTitle: true, coverPath: true, circleId: true, circle: true },
      },
    },
  });

  return NextResponse.json(history);
}
