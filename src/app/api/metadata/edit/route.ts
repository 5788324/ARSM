import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 });
  // Admin-only: metadata editing
  if (session.user?.name !== 'admin') return NextResponse.json({ error: '仅管理员可编辑元数据' }, { status: 403 });

  const url = new URL(req.url);
  const workId = url.searchParams.get('workId');
  if (!workId) return NextResponse.json({ error: '缺少 workId' }, { status: 400 });

  const body = await req.json();
  const work = await prisma.work.findUnique({ where: { id: workId } });
  if (!work) return NextResponse.json({ error: '作品未找到' }, { status: 404 });

  const updateData: any = {};
  if (body.displayTitle !== undefined) updateData.displayTitle = body.displayTitle;
  if (body.originalTitle !== undefined) updateData.originalTitle = body.originalTitle;
  if (body.releaseDate !== undefined) updateData.releaseDate = body.releaseDate;

  if (Object.keys(updateData).length > 0) {
    await prisma.work.update({ where: { id: workId }, data: updateData });
  }

  // User rating — per-user using UserRating table
  if (body.userRating !== undefined && session.user?.id) {
    if (body.userRating > 0) {
      await prisma.userRating.upsert({
        where: { userId_workId: { userId: session.user.id, workId } },
        update: { rating: body.userRating },
        create: { userId: session.user.id, workId, rating: body.userRating },
      });
    } else {
      await prisma.userRating.deleteMany({ where: { userId: session.user.id, workId } });
    }
  }

  // Re-fetch metadata if requested
  if (body.refetch && work.workCode) {
    try {
      const codeMatch = work.workCode.match(/^(RJ|VJ|BJ)(\d+)$/);
      if (codeMatch) {
        const res = await fetch(`https://api.asmr-300.com/api/work/${codeMatch[2]}`, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Origin': 'https://asmr.one', 'Referer': 'https://asmr.one/' },
        });
        if (res.ok) {
          const meta = await res.json();
          const refetchData: any = {};
          if (meta.title) refetchData.originalTitle = meta.title;
          if (meta.release) refetchData.releaseDate = meta.release;
          if (meta.circle?.name) {
            const c = await prisma.circle.upsert({ where: { name: meta.circle.name }, update: {}, create: { name: meta.circle.name } });
            refetchData.circleId = c.id;
          }
          refetchData.sourceSite = 'asmr.one';
          refetchData.sourceUrl = `https://www.asmr.one/work/${work.workCode}`;
          await prisma.work.update({ where: { id: workId }, data: refetchData });

          if (meta.tags?.length) {
            for (const t of meta.tags) {
              const tag = await prisma.tag.upsert({ where: { name: t.name || t }, update: {}, create: { name: t.name || t } });
              await prisma.workTag.upsert({ where: { workId_tagId: { workId, tagId: tag.id } }, update: {}, create: { workId, tagId: tag.id } }).catch(() => {});
            }
          }
          if (meta.vas?.length) {
            for (const va of meta.vas) {
              const actor = await prisma.voiceActor.upsert({ where: { name: va.name }, update: {}, create: { name: va.name } });
              await prisma.workVoiceActor.upsert({ where: { workId_voiceActorId: { workId, voiceActorId: actor.id } }, update: {}, create: { workId, voiceActorId: actor.id } }).catch(() => {});
            }
          }
        }
      }
    } catch {}
  }

  return NextResponse.json({ ok: true });
}
