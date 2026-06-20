/**
 * Acquisition job runner — orchestrates inspect → download → import → postprocess.
 *
 * Currently uses ImportJob as backing store. Will migrate to AcquisitionJob
 * table once schema is finalized across environments.
 */

import { prisma } from '@/lib/prisma';
import { findProvider } from './registry';
import { JobStatus, JobStep, JobProgress, PostprocessRequest } from './types';

/** Create and start an acquisition job. Returns immediately. */
export async function createAcquisitionJob(params: {
  providerId?: string;
  input: string;
  targetDir: string;
  autoImport?: boolean;
  postprocess?: PostprocessRequest;
}): Promise<{ id: string; status: string }> {
  const { input, targetDir, autoImport = true, postprocess } = params;

  let providerId = params.providerId;
  if (!providerId) {
    const provider = findProvider(input);
    if (!provider) throw new Error(`找不到支持 "${input}" 的采集来源`);
    providerId = provider.id;
  }

  // Use ImportJob as backing store (AcquisitionJob table exists but client may not have it yet)
  const job = await prisma.importJob.create({
    data: {
      userId: 'acquisition',
      status: 'pending',
      totalFiles: 0,
      foundWorks: 0,
      foundTracks: 0,
    },
  });

  // Start async execution (fire-and-forget)
  runAcquisitionJob(job.id, { providerId, input, targetDir, autoImport, postprocess }).catch(() => {});

  return { id: job.id, status: 'pending' };
}

/** Get a job by ID */
export async function getAcquisitionJob(id: string) {
  return prisma.importJob.findUnique({ where: { id } });
}

/** List recent jobs */
export async function listAcquisitionJobs(limit = 20) {
  return prisma.importJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// ─── Internal async runner ──────────────────────────────

async function runAcquisitionJob(
  jobId: string,
  opts: { providerId: string; input: string; targetDir: string; autoImport: boolean; postprocess?: PostprocessRequest },
) {
  try {
    // Step 1: Inspect
    await prisma.importJob.update({ where: { id: jobId }, data: { status: 'running' } });
    const provider = findProvider(opts.input);
    if (!provider) throw new Error(`找不到 provider: ${opts.providerId}`);

    const inspectResult = await provider.inspect(opts.input);

    // Step 2: Download
    const downloadResult = await provider.download(opts.input, opts.targetDir);
    const hasDownloadErrors = downloadResult.failed > 0;

    // Step 3: Import
    let importWorks = 0;
    let importTracks = 0;
    const importErrors: string[] = [];

    if (opts.autoImport) {
      try {
        const { LocalAdapter } = await import('@/lib/repository/local');
        const { scanLocalDirectory } = await import('@/lib/scanner');

        const scanRoot = `${opts.targetDir}/${inspectResult.sourceId}`;
        const adapter = new LocalAdapter('acquisition', scanRoot);
        const scanResult = await scanLocalDirectory('.', adapter);

        for (const group of scanResult.workGroups) {
          const work = await prisma.work.create({
            data: {
              displayTitle: group.folderName,
              originalTitle: group.folderName,
              trackCount: group.tracks.length,
            },
          });
          importWorks++;
          for (const tc of group.tracks) {
            await prisma.track.create({
              data: { workId: work.id, trackNumber: tc.trackNumber, title: tc.filename.replace(/\.[^.]+$/, '') },
            });
            importTracks++;
          }
        }
      } catch (err) {
        importErrors.push(err instanceof Error ? err.message : '导入失败');
      }
    }

    // Step 4: Postprocess (stub)
    if (opts.postprocess) {
      // Future: extract_text, transcribe_audio, translate_text, etc.
    }

    // Final status
    const finalStatus = hasDownloadErrors ? 'done_with_errors' : 'done';

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        totalFiles: inspectResult.fileCount,
        foundWorks: importWorks,
        foundTracks: importTracks,
        errors: importErrors.length > 0 ? JSON.stringify(importErrors) : null,
        finishedAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errors: JSON.stringify([err instanceof Error ? err.message : 'Unknown error']),
        finishedAt: new Date(),
      },
    });
  }
}
