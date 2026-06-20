import { prisma } from '@/lib/prisma';
import { getProvider, findProvider } from './registry';
import { runImport } from '@/lib/import/service';
import type { PostprocessRequest } from './types';

let progressTimers: Record<string, ReturnType<typeof setTimeout>> = {};
let pendingProgress: Record<string, { done: number; failed: number; bytes: number; files: Record<string, { path: string; size: number; downloaded: number; status: string; error?: string }> }> = {};

export async function createAcquisitionJob(params: {
  providerId?: string; input: string; targetDir: string; autoImport?: boolean; postprocess?: PostprocessRequest;
}): Promise<{ id: string; status: string }> {
  const { input, targetDir, autoImport = true, postprocess } = params;
  let providerId = params.providerId;
  if (!providerId) { const p = findProvider(input); if (!p) throw new Error(`找不到支持 "${input}" 的来源`); providerId = p.id; }
  const job = await prisma.acquisitionJob.create({ data: { providerId, input, normalizedSourceId: input, targetDir, status: 'pending' } });
  runAcquisitionJob(job.id, { providerId, input, targetDir, autoImport, postprocess }).catch(() => {});
  return { id: job.id, status: 'pending' };
}

export async function getAcquisitionJob(id: string) { return prisma.acquisitionJob.findUnique({ where: { id } }); }
export async function listAcquisitionJobs(limit = 20) { return prisma.acquisitionJob.findMany({ orderBy: { createdAt: 'desc' }, take: limit }); }

async function updateJob(id: string, data: Record<string, unknown>) { await prisma.acquisitionJob.update({ where: { id }, data }); }
async function failJob(id: string, msg: string) { await updateJob(id, { status: 'failed', errorJson: JSON.stringify({ message: msg }), finishedAt: new Date() }); }

async function runAcquisitionJob(jobId: string, opts: { providerId: string; input: string; targetDir: string; autoImport: boolean; postprocess?: PostprocessRequest }) {
  try {
    const provider = getProvider(opts.providerId);
    if (!provider) { await failJob(jobId, `未知 provider: ${opts.providerId}`); return; }

    // Inspect
    await updateJob(jobId, { status: 'inspecting', currentStep: 'inspect', startedAt: new Date() });
    const inspect = await provider.inspect(opts.input);
    pendingProgress[jobId] = { done: 0, failed: 0, bytes: 0, files: {} };
    await flushProgress(jobId, inspect);

    if (!opts.autoImport) { await updateJob(jobId, { status: 'done', finishedAt: new Date() }); return; }

    // Download
    await updateJob(jobId, { status: 'downloading', currentStep: 'download' });
    const downloadResult = await provider.download(opts.input, opts.targetDir, {
      onFileStart: (path) => { recordProgress(jobId, path, 'downloading', 0, 0); },
      onFileProgress: (path, downloaded, size) => {
        const pp = pendingProgress[jobId];
        if (pp) pp.bytes += Math.min(8192, size - (pp.files[path]?.downloaded || 0));
        recordProgress(jobId, path, 'downloading', downloaded, size);
      },
      onFileDone: (path) => { recordProgress(jobId, path, 'done', 0, 0, true); },
      onFileError: (path, error) => { recordProgress(jobId, path, 'failed', 0, 0, false, error); },
    });

    // Import
    let importWorks = 0, importTracks = 0, reviewCount = 0;
    const importErrors: string[] = [];
    if (opts.autoImport) {
      await updateJob(jobId, { status: 'importing', currentStep: 'import' });
      try {
        const scanRoot = `${opts.targetDir}/${inspect.sourceId}`;
        const ir = await runImport({ rootPath: scanRoot, groupByTop: true });
        importWorks = ir.foundWorks; importTracks = ir.foundTracks; reviewCount = ir.reviewCount;
        importErrors.push(...ir.errors);
      } catch (err) { importErrors.push(err instanceof Error ? err.message : '导入失败'); }
    }

    // Metadata auto-match
    if (importWorks > 0 && inspect.sourceId) {
      try {
        const codeMatch = inspect.sourceId.match(/^(RJ|VJ|BJ)(\d+)$/);
        if (codeMatch) {
          const existingWork = await prisma.work.findFirst({ where: { workCode: inspect.sourceId }, orderBy: { createdAt: 'desc' } });
          if (existingWork) {
            // Fetch metadata from asmr.one
            const token = await getAsmrOneToken();
            const metaRes = await fetch(`https://api.asmr-300.com/api/work/${codeMatch[2]}`, {
              headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Mozilla/5.0', 'Origin': 'https://asmr.one', 'Referer': 'https://asmr.one/' },
            });
            if (metaRes.ok) {
              const meta = await metaRes.json();
              const updateData: Record<string, unknown> = {};
              if (meta.title && !existingWork.originalTitle) updateData.originalTitle = meta.title;
              if (meta.release && !existingWork.releaseDate) updateData.releaseDate = meta.release;
              if (meta.circle?.name && !existingWork.circleId) {
                const c = await prisma.circle.upsert({ where: { name: meta.circle.name }, update: {}, create: { name: meta.circle.name } });
                updateData.circleId = c.id;
              }
              if (!existingWork.sourceSite) updateData.sourceSite = 'asmr.one';
              if (!existingWork.sourceUrl) updateData.sourceUrl = `https://www.asmr.one/work/${inspect.sourceId}`;
              if (Object.keys(updateData).length > 0) await prisma.work.update({ where: { id: existingWork.id }, data: updateData });
              // Tags
              if (meta.tags?.length) {
                for (const t of meta.tags) {
                  const tag = await prisma.tag.upsert({ where: { name: t.name || t }, update: {}, create: { name: t.name || t } });
                  await prisma.workTag.upsert({ where: { workId_tagId: { workId: existingWork.id, tagId: tag.id } }, update: {}, create: { workId: existingWork.id, tagId: tag.id } }).catch(() => {});
                }
              }
              // Voice actors
              if (meta.vas?.length) {
                for (const va of meta.vas) {
                  const actor = await prisma.voiceActor.upsert({ where: { name: va.name }, update: {}, create: { name: va.name } });
                  await prisma.workVoiceActor.upsert({ where: { workId_voiceActorId: { workId: existingWork.id, voiceActorId: actor.id } }, update: {}, create: { workId: existingWork.id, voiceActorId: actor.id } }).catch(() => {});
                }
              }
            }
          }
        }
      } catch (metaErr) { importErrors.push(`元数据: ${metaErr instanceof Error ? metaErr.message : String(metaErr)}`); }
    }

    // Postprocess
    if (opts.postprocess) { await updateJob(jobId, { status: 'postprocessing', currentStep: 'postprocess' }); }

    const hasDownloads = downloadResult.failed > 0, hasImports = importErrors.length > 0;
    const finalStatus = reviewCount > 0 ? 'review' : hasDownloads || hasImports ? 'done_with_errors' : 'done';
    const ep: Record<string, unknown> = {};
    if (downloadResult.errors.length > 0) ep.download = downloadResult.errors;
    if (importErrors.length > 0) ep.import = importErrors;

    await flushProgress(jobId, inspect, true);
    await updateJob(jobId, {
      status: finalStatus, currentStep: null,
      resultJson: JSON.stringify({ download: { done: downloadResult.done, failed: downloadResult.failed }, import: { foundWorks: importWorks, foundTracks: importTracks } }),
      errorJson: Object.keys(ep).length > 0 ? JSON.stringify(ep) : null, finishedAt: new Date(),
    });
  } catch (err) { await failJob(jobId, err instanceof Error ? err.message : 'Unknown error'); }
}

// ─── Progress helpers ────────────────────────────────────

function recordProgress(jobId: string, path: string, status: string, downloaded: number, size: number, isDone = false, error?: string) {
  const pp = pendingProgress[jobId];
  if (!pp) return;
  if (!pp.files[path]) pp.files[path] = { path, size, downloaded: 0, status };
  const f = pp.files[path];
  f.status = status;
  f.downloaded = downloaded;
  f.size = size || f.size;
  if (error) f.error = error;

  if (isDone && f.status !== 'done') {
    pp.done++;
    if (f.status !== 'failed') pp.failed--;
    f.status = 'done';
  }
  if (status === 'failed' && f.status !== 'failed') {
    pp.failed++;
    pp.done = Math.max(0, pp.done - 1);
  }

  // Flush immediately on done/failed. Throttle others to 500ms.
  if (isDone || status === 'failed') {
    clearTimeout(progressTimers[jobId]);
    flushProgressNow(jobId).catch(() => {});
  } else {
    clearTimeout(progressTimers[jobId]);
    progressTimers[jobId] = setTimeout(() => flushProgressNow(jobId).catch(() => {}), 500);
  }
}

async function flushProgress(jobId: string, inspect: { fileCount: number; totalSize: number; title?: string; hasSubtitle?: boolean }, force = false) {
  if (force) { clearTimeout(progressTimers[jobId]); await flushProgressNow(jobId); }
}

async function flushProgressNow(jobId: string) {
  const pp = pendingProgress[jobId];
  if (!pp) return;
  const files = Object.values(pp.files).map((f) => ({
    path: f.path, size: f.size, downloaded: f.downloaded,
    status: f.status, error: f.error,
    percent: f.size > 0 ? Math.round((f.downloaded / f.size) * 100) : 0,
  }));
  const done = files.filter((f) => f.status === 'done').length;
  const failed = files.filter((f) => f.status === 'failed').length;
  const total = pp.done + pp.failed + files.filter((f) => f.status === 'downloading' || f.status === 'pending').length;

  const job = await getAcquisitionJob(jobId);
  if (!job) return;
  let progress: Record<string, unknown> = {};
  try { progress = JSON.parse(job.progressJson || '{}'); } catch {}
  const oldDl = (progress.download as Record<string, unknown>) || {};

  progress.download = {
    ...oldDl,
    doneFiles: done,
    failedFiles: failed,
    totalFiles: total || (oldDl.totalFiles || 0),
    bytesDownloaded: pp.bytes || 0,
    totalBytes: oldDl.totalBytes,
    currentFile: files.filter((f) => f.status === 'downloading').pop()?.path || null,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
    files: files.slice(-100),
  };

  await updateJob(jobId, { progressJson: JSON.stringify(progress) });
}

// ─── Metadata helper ─────────────────────────────────────

let asmrToken: string | null = null;
let asmrTokenExpiry = 0;
async function getAsmrOneToken(): Promise<string> {
  if (asmrToken && Date.now() < asmrTokenExpiry) return asmrToken;
  const res = await fetch('https://api.asmr-300.com/api/auth/me', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Origin': 'https://asmr.one', 'Referer': 'https://asmr.one/', 'User-Agent': 'Mozilla/5.0' },
    body: JSON.stringify({ name: 'guest', password: 'guest' }),
  });
  if (!res.ok) throw new Error('AsmrOne auth failed');
  const data = await res.json();
  asmrToken = data.token;
  if (!asmrToken) throw new Error('AsmrOne auth: no token');
  asmrTokenExpiry = Date.now() + 55 * 60 * 1000;
  return asmrToken;
}
