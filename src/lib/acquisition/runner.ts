/**
 * Acquisition job runner — Phase 4: per-file progress + auto-metadata.
 */

import { prisma } from '@/lib/prisma';
import { getProvider, findProvider } from './registry';
import { runImport } from '@/lib/import/service';
import { PostprocessRequest } from './types';

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
    data: { providerId, input, normalizedSourceId: input, targetDir, status: 'pending' },
  });

  runAcquisitionJob(job.id, { providerId, input, targetDir, autoImport, postprocess }).catch(() => {});
  return { id: job.id, status: 'pending' };
}

export async function getAcquisitionJob(id: string) {
  return prisma.acquisitionJob.findUnique({ where: { id } });
}

export async function listAcquisitionJobs(limit = 20) {
  return prisma.acquisitionJob.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
}

async function runAcquisitionJob(
  jobId: string,
  opts: { providerId: string; input: string; targetDir: string; autoImport: boolean; postprocess?: PostprocessRequest },
) {
  try {
    const provider = getProvider(opts.providerId);
    if (!provider) {
      await failJob(jobId, `未知 provider: ${opts.providerId}`);
      return;
    }

    // Step 1: Inspect
    await updateJob(jobId, { status: 'inspecting', currentStep: 'inspect', startedAt: new Date() });
    const inspectResult = await provider.inspect(opts.input);
    await updateJob(jobId, {
      normalizedSourceId: inspectResult.sourceId,
      progressJson: JSON.stringify({
        inspect: { fileCount: inspectResult.fileCount, totalSize: inspectResult.totalSize, title: inspectResult.title, hasSubtitle: inspectResult.hasSubtitle },
        download: { totalFiles: inspectResult.fileCount, doneFiles: 0, failedFiles: 0, bytesDownloaded: 0, totalBytes: inspectResult.totalSize, percent: 0, currentFile: null, files: [] },
      }),
    });

    if (!opts.autoImport) {
      await updateJob(jobId, { status: 'done', currentStep: null, finishedAt: new Date() });
      return;
    }

    // Step 2: Download — with per-file progress hooks
    await updateJob(jobId, { status: 'downloading', currentStep: 'download' });

    let downloadErrors: string[] = [];
    let totalDownloaded = 0;

    const downloadResult = await provider.download(opts.input, opts.targetDir, {
      onFileStart: (path) => {
        updateJobProgress(jobId, inspectResult, { path, size: 0, downloaded: 0, status: 'downloading' });
      },
      onFileProgress: (path, downloaded, size) => {
        totalDownloaded += 8192; // approximate per chunk
        updateJobProgress(jobId, inspectResult, { path, size, downloaded, status: 'downloading' });
      },
      onFileDone: (path) => {
        updateJobProgress(jobId, inspectResult, { path, status: 'done' }, true);
      },
      onFileError: (path, error) => {
        downloadErrors.push(`${path}: ${error}`);
        updateJobProgress(jobId, inspectResult, { path, status: 'failed', error });
      },
    });

    // Step 3: Import
    let importWorks = 0, importTracks = 0, reviewCount = 0;
    const importErrors: string[] = [];

    if (opts.autoImport) {
      await updateJob(jobId, { status: 'importing', currentStep: 'import' });
      try {
        const scanRoot = `${opts.targetDir}/${inspectResult.sourceId}`;
        const importResult = await runImport({ rootPath: scanRoot, groupByTop: true });
        importWorks = importResult.foundWorks;
        importTracks = importResult.foundTracks;
        reviewCount = importResult.reviewCount;
        importErrors.push(...importResult.errors);
      } catch (err) {
        importErrors.push(err instanceof Error ? err.message : '导入失败');
      }
    }

    // Step 4: Postprocess (stub)
    if (opts.postprocess) {
      await updateJob(jobId, { status: 'postprocessing', currentStep: 'postprocess' });
    }

    // Final status
    const hasDownloadErrors = downloadResult.failed > 0;
    const hasImportErrors = importErrors.length > 0;
    const hasReview = reviewCount > 0;
    const finalStatus = hasReview ? 'review' : hasDownloadErrors || hasImportErrors ? 'done_with_errors' : 'done';

    const errorPayload: Record<string, unknown> = {};
    if (downloadErrors.length > 0) errorPayload.download = downloadErrors;
    if (importErrors.length > 0) errorPayload.import = importErrors;

    await updateJob(jobId, {
      status: finalStatus,
      currentStep: null,
      resultJson: JSON.stringify({
        download: { done: downloadResult.done, failed: downloadResult.failed },
        import: { foundWorks: importWorks, foundTracks: importTracks },
      }),
      errorJson: Object.keys(errorPayload).length > 0 ? JSON.stringify(errorPayload) : null,
      finishedAt: new Date(),
    });
  } catch (err) {
    await failJob(jobId, err instanceof Error ? err.message : 'Unknown error');
  }
}

// ─── Helpers ────────────────────────────────────────────

async function updateJob(id: string, data: Record<string, unknown>) {
  await prisma.acquisitionJob.update({ where: { id }, data });
}

async function failJob(id: string, message: string) {
  await prisma.acquisitionJob.update({
    where: { id },
    data: { status: 'failed', errorJson: JSON.stringify({ message }), finishedAt: new Date() },
  });
}

/** Throttled per-file progress update — writes to progressJson.files array */
let progressThrottle: Record<string, ReturnType<typeof setTimeout>> = {};

async function updateJobProgress(
  jobId: string,
  inspect: { fileCount: number; totalSize: number; title?: string; hasSubtitle?: boolean },
  file: { path: string; size?: number; downloaded?: number; status: string; error?: string },
  incrementDone = false,
) {
  // Throttle: only write every 500ms per job
  const key = `progress-${jobId}`;
  if (progressThrottle[key]) return;
  progressThrottle[key] = setTimeout(() => { delete progressThrottle[key]; }, 500);

  const job = await getAcquisitionJob(jobId);
  if (!job) return;

  let progress: Record<string, unknown> = {};
  try { progress = JSON.parse(job.progressJson || '{}'); } catch {}
  const dl = (progress.download as Record<string, unknown>) || {};

  const files = (dl.files as Array<Record<string, unknown>>) || [];
  const idx = files.findIndex((f) => f.path === file.path);
  const entry = {
    path: file.path,
    size: file.size || (idx >= 0 ? files[idx].size : 0),
    downloaded: file.downloaded || 0,
    status: file.status,
    error: file.error,
    percent: file.size ? Math.round((file.downloaded || 0) / file.size * 100) : 0,
  };

  if (idx >= 0) files[idx] = entry;
  else files.push(entry);

  // Keep only last 100 files
  const trimmed = files.slice(-100);

  const doneCount = trimmed.filter((f) => f.status === 'done').length;
  const failedCount = trimmed.filter((f) => f.status === 'failed').length;

  progress.download = {
    ...dl,
    doneFiles: incrementDone ? (Number(dl.doneFiles || 0) + 1) : dl.doneFiles,
    failedFiles: failedCount,
    currentFile: file.status === 'downloading' ? file.path : dl.currentFile,
    percent: inspect.fileCount > 0 ? Math.round((Number(dl.doneFiles || 0) / inspect.fileCount) * 100) : 0,
    files: trimmed,
  };

  await updateJob(jobId, { progressJson: JSON.stringify(progress) });
}
