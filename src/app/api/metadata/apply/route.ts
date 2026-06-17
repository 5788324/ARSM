import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Apply fetched metadata from a MetadataJob to an existing Work.
 *
 * Policy: fill empty fields only (don't overwrite existing data).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { jobId, workId } = await req.json();
  if (!jobId || !workId) {
    return NextResponse.json({ error: 'jobId and workId required' }, { status: 400 });
  }

  const job = await prisma.metadataJob.findUnique({ where: { id: jobId } });
  if (!job || !job.resultJson) {
    return NextResponse.json({ error: 'Job not found or has no result data' }, { status: 404 });
  }

  const work = await prisma.work.findUnique({ where: { id: workId } });
  if (!work) {
    return NextResponse.json({ error: 'Work not found' }, { status: 404 });
  }

  let metadata;
  try {
    metadata = JSON.parse(job.resultJson);
  } catch {
    return NextResponse.json({ error: 'Invalid metadata JSON in job' }, { status: 500 });
  }

  const changes: string[] = [];
  const updateData: Record<string, unknown> = {};

  // Fill empty fields only
  if (metadata.displayTitle && !work.displayTitle) {
    updateData.displayTitle = metadata.displayTitle;
    changes.push('displayTitle');
  }
  if (metadata.originalTitle && !work.originalTitle) {
    updateData.originalTitle = metadata.originalTitle;
    changes.push('originalTitle');
  }
  if (metadata.workCode && !work.workCode) {
    updateData.workCode = metadata.workCode;
    changes.push('workCode');
  }
  if (metadata.description && !work.description) {
    updateData.description = metadata.description;
    changes.push('description');
  }
  if (metadata.releaseDate && !work.releaseDate) {
    updateData.releaseDate = metadata.releaseDate;
    changes.push('releaseDate');
  }

  // Handle circle
  if (metadata.circleName && !work.circleId) {
    const circle = await prisma.circle.upsert({
      where: { name: metadata.circleName },
      update: {},
      create: { name: metadata.circleName },
    });
    updateData.circleId = circle.id;
    changes.push('circle');
  }

  // Apply work updates
  if (Object.keys(updateData).length > 0) {
    await prisma.work.update({ where: { id: workId }, data: updateData });
  }

  // Handle tags (add if not present)
  if (Array.isArray(metadata.tags) && metadata.tags.length > 0) {
    const existingTags = await prisma.workTag.findMany({
      where: { workId },
      include: { tag: true },
    });
    const existingNames = new Set(existingTags.map((wt) => wt.tag.name));

    for (const tagName of metadata.tags) {
      if (existingNames.has(tagName)) continue;

      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        update: {},
        create: { name: tagName },
      });

      await prisma.workTag.create({
        data: { workId, tagId: tag.id },
      });
      changes.push(`tag:${tagName}`);
    }
  }

  // Handle voice actors
  if (Array.isArray(metadata.voiceActors) && metadata.voiceActors.length > 0) {
    const existingVAs = await prisma.workVoiceActor.findMany({
      where: { workId },
      include: { voiceActor: true },
    });
    const existingNames = new Set(existingVAs.map((wva) => wva.voiceActor.name));

    for (const vaName of metadata.voiceActors) {
      if (existingNames.has(vaName)) continue;

      const va = await prisma.voiceActor.upsert({
        where: { name: vaName },
        update: {},
        create: { name: vaName },
      });

      await prisma.workVoiceActor.create({
        data: { workId, voiceActorId: va.id },
      });
      changes.push(`voiceActor:${vaName}`);
    }
  }

  // Save source reference
  await prisma.workSource.upsert({
    where: {
      id: `${workId}-${job.provider}`,
    },
    update: {
      sourceUrl: metadata.sourceUrl || job.queryValue,
      fetchedAt: new Date(),
    },
    create: {
      id: `${workId}-${job.provider}`,
      workId,
      sourceName: job.provider,
      sourceUrl: metadata.sourceUrl || job.queryValue,
    },
  });

  // Mark job as applied
  await prisma.metadataJob.update({
    where: { id: jobId },
    data: {
      workId,
      appliedAt: new Date(),
      status: 'done',
    },
  });

  return NextResponse.json({
    ok: true,
    workId,
    jobId,
    changes,
    appliedFields: Object.keys(updateData),
  });
}
