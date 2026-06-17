import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** Merge multiple works into one */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { targetId, sourceIds } = await req.json();
  if (!targetId || !Array.isArray(sourceIds) || sourceIds.length === 0) {
    return NextResponse.json({ error: 'targetId and sourceIds (array) required' }, { status: 400 });
  }

  const target = await prisma.work.findUnique({ where: { id: targetId } });
  if (!target) return NextResponse.json({ error: 'Target work not found' }, { status: 404 });

  let mergedTracks = 0;
  let mergedTags = 0;
  let mergedVAs = 0;

  for (const sourceId of sourceIds) {
    if (sourceId === targetId) continue;

    const source = await prisma.work.findUnique({ where: { id: sourceId } });
    if (!source) continue;

    // Move tracks to target
    const trackCount = await prisma.track.count({ where: { workId: sourceId } });
    if (trackCount > 0) {
      // Re-number tracks to avoid conflicts
      const maxTrackNum = await prisma.track.findFirst({
        where: { workId: targetId },
        orderBy: { trackNumber: 'desc' },
        select: { trackNumber: true },
      });
      const offset = maxTrackNum ? maxTrackNum.trackNumber : 0;

      const sourceTracks = await prisma.track.findMany({
        where: { workId: sourceId },
        orderBy: { trackNumber: 'asc' },
      });

      for (const track of sourceTracks) {
        await prisma.track.update({
          where: { id: track.id },
          data: {
            workId: targetId,
            trackNumber: track.trackNumber + offset,
          },
        });
      }
      mergedTracks += trackCount;
    }

    // Move tags
    const sourceTags = await prisma.workTag.findMany({ where: { workId: sourceId } });
    for (const st of sourceTags) {
      try {
        await prisma.workTag.create({ data: { workId: targetId, tagId: st.tagId } });
        mergedTags++;
      } catch {
        // Already exists, skip
      }
    }

    // Move voice actors
    const sourceVAs = await prisma.workVoiceActor.findMany({ where: { workId: sourceId } });
    for (const sva of sourceVAs) {
      try {
        await prisma.workVoiceActor.create({
          data: { workId: targetId, voiceActorId: sva.voiceActorId },
        });
        mergedVAs++;
      } catch {
        // Already exists, skip
      }
    }

    // Move favorites
    await prisma.favorite.updateMany({
      where: { workId: sourceId },
      data: { workId: targetId },
    });

    // Move listening history
    await prisma.listeningHistory.updateMany({
      where: { workId: sourceId },
      data: { workId: targetId },
    });

    // Delete the source work
    await prisma.work.delete({ where: { id: sourceId } });
  }

  // Update target work stats
  const finalTrackCount = await prisma.track.count({ where: { workId: targetId } });
  const trackDurations = await prisma.track.findMany({
    where: { workId: targetId },
    select: { durationSec: true },
  });
  const totalDuration = trackDurations.reduce((sum, t) => sum + (t.durationSec || 0), 0);

  await prisma.work.update({
    where: { id: targetId },
    data: {
      trackCount: finalTrackCount,
      durationSec: totalDuration,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    targetId,
    mergedSources: sourceIds.filter((id) => id !== targetId).length,
    mergedTracks,
    mergedTags,
    mergedVAs,
    finalTrackCount,
  });
}
