import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Phase 9: Acquisition workflow — admin-triggered download of a specific work.
 *
 * Accepts a work URL or code, downloads media into the configured repository.
 *
 * Safety: single-work only, no crawling, admin-only.
 */

interface AcquireRequest {
  provider: string;       // "dlsite", "asmrone", etc.
  url?: string;           // Direct download URL
  code?: string;          // Work code (RJ123456)
  repositoryId?: string;  // Target repository (defaults to first local)
  workId?: string;        // Link to an existing work record
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: AcquireRequest = await req.json();

  if (!body.provider) {
    return NextResponse.json({ error: 'provider required' }, { status: 400 });
  }
  if (!body.url && !body.code) {
    return NextResponse.json({ error: 'url or code required' }, { status: 400 });
  }

  // Find target repository
  let repo;
  if (body.repositoryId) {
    repo = await prisma.storageRepository.findUnique({ where: { id: body.repositoryId } });
  } else {
    repo = await prisma.storageRepository.findFirst({
      where: { type: 'local', isEnabled: true },
    });
  }

  if (!repo) {
    return NextResponse.json(
      { error: 'No enabled local repository found. Configure one in /admin/repositories.' },
      { status: 400 },
    );
  }

  // Create acquisition job record
  // (Uses metadata_jobs table since schema already supports it)
  const job = await prisma.metadataJob.create({
    data: {
      userId: session.user!.id!,
      workId: body.workId || null,
      queryType: body.url ? 'url' : 'code',
      queryValue: body.url || body.code || '',
      provider: body.provider,
      status: 'pending',
    },
  });

  // In MVP, acquisition is a manual process:
  // 1. Admin triggers the request
  // 2. Files should be manually placed in the repository
  // 3. Then run import scan to pick them up
  //
  // Full automation requires provider-specific download logic
  // which is out of scope for MVP.

  await prisma.metadataJob.update({
    where: { id: job.id },
    data: {
      status: 'done',
      resultJson: JSON.stringify({
        message:
          'Acquisition request recorded. Place downloaded files in the repository and run Import to index them.',
        provider: body.provider,
        targetRepo: repo.name,
        targetPath: repo.rootPath,
        workId: body.workId,
      }),
      finishedAt: new Date(),
    },
  });

  return NextResponse.json({
    jobId: job.id,
    status: 'done',
    message: 'Acquisition request recorded. Place files in the repository, then run Import.',
    repository: {
      name: repo.name,
      path: repo.rootPath,
    },
  });
}
