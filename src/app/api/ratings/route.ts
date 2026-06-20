import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const url = new URL(req.url);
  const workId = url.searchParams.get('workId');
  if (!workId) return NextResponse.json({ error: '缺少 workId' }, { status: 400 });

  const body = await req.json();
  const rating = typeof body.rating === 'number' ? body.rating : 0;

  if (rating > 0) {
    await prisma.userRating.upsert({
      where: { userId_workId: { userId: session.user!.id!, workId } },
      update: { rating },
      create: { userId: session.user!.id!, workId, rating },
    });
  } else {
    await prisma.userRating.deleteMany({ where: { userId: session.user!.id!, workId } });
  }

  return NextResponse.json({ ok: true });
}
