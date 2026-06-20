/**
 * Acquisition job runner — orchestrates inspect → download → import → postprocess.
 *
 * Uses AcquisitionJob as backing store. Import step reuses the shared import service.
 */

import { prisma } from '@/lib/prisma';
import { getProvider, findProvider } from './registry';
import { runImport } from '@/lib/import/service';
import { PostprocessRequest } from './types';

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

  const job = await prisma.acquisitionJob.create({
    data: {
      providerId,
      input,
      normalizedSourceId: input,
      targetDir,
      status: 'pending',
    },
  });

  // Start async execution (fire-and-forget)
  runAcquisitionJob(job.id, { providerId, input, targetDir, autoImport, postprocess }).catch(() => {});

  return { id: job.id, status: 'pending' };
}

/** Get a job by ID */
export async function getAcquisitionJob(id: string) {
  return prisma.acquisitionJob.findUnique({ where: { id } });
}

/** List recent jobs */
export async function listAcquisitionJobs(limit = 20) {
  return prisma.acquisitionJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

// ─── Internal async runner ──────────────────────────────

async function runAcquisitionJob(
  jobId: string,
  opts: {
    providerId: string;
    input: string;
    targetDir: string;
    autoImport: boolean;
    postprocess?: PostprocessRequest;
  },
) {
  try {
    // Step 1: Resolve provider
    const provider = getProvider(opts.providerId);
    if (!provider) {
      await prisma.acquisitionJob.update({
        where: { id: jobId },
        data: { status: 'failed', errorJson: JSON.stringify({ message: `未知 provider: ${opts.providerId}` }), finishedAt: new Date() },
      });
      return;
    }

    // Step 2: Inspect
    await prisma.acquisitionJob.update({
      where: { id: jobId },
      data: { status: 'inspecting', currentStep: 'inspect', startedAt: new Date() },
    });

    const inspectResult = await provider.inspect(opts.input);

    await prisma.acquisitionJob.update({
      where: { id: jobId },
      data: {
        normalizedSourceId: inspectResult.sourceId,
        progressJson: JSON.stringify({
          inspect: { fileCount: inspectResult.fileCount, totalSize: inspectResult.totalSize },
        }),
      },
    });

    // Step 3: Download
    await prisma.acquisitionJob.update({
      where: { id: jobId },
      data: { status: 'downloading', currentStep: 'download' },
    });

    const downloadResult = await provider.download(opts.input, opts.targetDir);

    await prisma.acquisitionJob.update({
      where: { id: jobId },
      data: {
        progressJson: JSON.stringify({
          inspect: { fileCount: inspectResult.fileCount, totalSize: inspectResult.totalSize },
          download: { totalFiles: downloadResult.total, doneFiles: downloadResult.done, failedFiles: downloadResult.failed, bytesDownloaded: downloadResult.bytesDownloaded },
        }),
      },
    });

    // Step 4: Import (reuses shared import service)
    let importResult: { status: string; foundWorks: number; foundTracks: number; reviewCount: number; errors: string[] } = {
      status: 'skipped', foundWorks: 0, foundTracks: 0, reviewCount: 0, errors: [],
    };

    if (opts.autoImport) {
      await prisma.acquisitionJob.update({
        where: { id: jobId },
        data: { status: 'importing', currentStep: 'import' },
      });

      try {
        const scanRoot = `${opts.targetDir}/${inspectResult.sourceId}`;
        importResult = await runImport({ rootPath: scanRoot });
      } catch (err) {
        importResult.errors.push(err instanceof Error ? err.message : '导入失败');
      }
    }

    // Step 5: Postprocess (stub)
    if (opts.postprocess) {
      await prisma.acquisitionJob.update({
        where: { id: jobId },
        data: { status: 'postprocessing', currentStep: 'postprocess' },
      });
    }

    // Final status
    const hasDownloadErrors = downloadResult.failed > 0;
    const hasImportErrors = importResult.errors.length > 0;
    const hasReview = importResult.reviewCount > 0;

    const finalStatus = hasReview
      ? 'review'
      : hasDownloadErrors || hasImportErrors
        ? 'done_with_errors'
        : 'done';

    const progress = {
      inspect: { fileCount: inspectResult.fileCount, totalSize: inspectResult.totalSize },
      download: { totalFiles: downloadResult.total, doneFiles: downloadResult.done, failedFiles: downloadResult.failed, bytesDownloaded: downloadResult.bytesDownloaded },
      import: { foundWorks: importResult.foundWorks, foundTracks: importResult.foundTracks, reviewCount: importResult.reviewCount, errors: importResult.errors },
      postprocess: opts.postprocess ? { status: 'stub' } : undefined,
    };

    await prisma.acquisitionJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        currentStep: null,
        progressJson: JSON.stringify(progress),
        resultJson: JSON.stringify({ download: { done: downloadResult.done, failed: downloadResult.failed }, import: { foundWorks: importResult.foundWorks, foundTracks: importResult.foundTracks } }),
        errorJson: importResult.errors.length > 0 ? JSON.stringify({ import: importResult.errors, download: downloadResult.errors }) : null,
        finishedAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.acquisitionJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errorJson: JSON.stringify({ message: err instanceof Error ? err.message : 'Unknown error' }),
        finishedAt: new Date(),
      },
    });
  }
}
