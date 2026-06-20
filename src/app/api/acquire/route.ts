import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * ⚠ DEPRECATED — use /api/acquisition/asmrone for asmr.one downloads.
 *
 * This was the Phase 9 MVP placeholder. It only records acquisition requests
 * and tells the admin to manually place files. Real download capability now
 * lives in src/lib/acquisition/asmrone.ts with its own API route.
 *
 * This route is kept for backward compatibility and will be removed or unified
 * once the acquisition job system is implemented.
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
