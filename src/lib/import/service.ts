/**
 * Shared import service — Phase 4 fix: subtitle pipeline + full group path.
 */

import { prisma } from '@/lib/prisma';
import { LocalAdapter, isAudioFile } from '@/lib/repository/local';

export interface ImportInput { repositoryId?: string; rootPath: string; groupByTop?: boolean; }

export interface SubtitleFile { relativePath: string; filename: string; kind: string; language?: string; label?: string; }
export interface WorkGroup { folderName: string; folderPath: string; tracks: { relativePath: string; filename: string; trackNumber: number; size: number }[]; coverPath?: string; subtitleFiles: SubtitleFile[]; }

export interface ImportResult { status: 'done' | 'review' | 'done_with_errors' | 'failed'; foundWorks: number; foundTracks: number; reviewCount: number; totalFiles: number; skippedFiles: number; errors: string[]; foundSubtitles: number; reviewCandidates?: { folderName: string; folderCode: string | null; candidateWorks: { id: string; title: string; code: string | null }[] }[]; }

export async function scanDirectory(rootPath: string, groupByTop = false) {
  const adapter = new LocalAdapter('import', rootPath);
  const entries = await adapter.listFiles('.');
  const folders = new Map<string, { tracks: WorkGroup['tracks']; coverPath?: string; subtitleFiles: SubtitleFile[] }>();
  const skippedFiles: string[] = [];

  function classifyKind(name: string) { if (/\.vtt$/i.test(name)) return 'vtt'; if (/\.srt$/i.test(name)) return 'srt'; if (/\.lrc$/i.test(name)) return 'lrc'; if (/\.txt$/i.test(name)) return 'txt'; if (/\.pdf$/i.test(name)) return 'pdf'; return 'txt'; }
  function classifyLabel(name: string) { const l = name.toLowerCase(); if (l.includes('字幕') || l.includes('subtitle')) return '字幕'; if (l.includes('台本') || l.includes('script')) return '台本'; if (l.includes('readme')) return '说明'; return '文本'; }
  function detectLanguage(name: string): string | undefined { const l = name.toLowerCase(); if (/[\u3040-\u309f\u30a0-\u30ff]/.test(name)) return 'ja'; if (/[\u4e00-\u9fff]/.test(name)) return 'zh-CN'; return undefined; }

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const firstSlash = entry.relativePath.indexOf('/');
    const folderPath = groupByTop && firstSlash > 0 ? entry.relativePath.substring(0, firstSlash) : entry.relativePath.substring(0, entry.relativePath.lastIndexOf('/'));
    const folderKey = folderPath || '__root__';
    if (!folders.has(folderKey)) folders.set(folderKey, { tracks: [], subtitleFiles: [] });
    const group = folders.get(folderKey)!;

    if (isAudioFile(entry.name)) {
      const tm = entry.name.match(/^(\\d+)/);
      const tn = tm ? parseInt(tm[1], 10) : group.tracks.length + 1;
      group.tracks.push({ relativePath: entry.relativePath, filename: entry.name, trackNumber: tn, size: entry.size });
    } else if (/^(cover|folder|jacket)\\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
      group.coverPath = entry.relativePath;
    } else if (/\\.(vtt|srt|lrc|txt|pdf)$/i.test(entry.name)) {
      group.subtitleFiles.push({ relativePath: entry.relativePath, filename: entry.name, kind: classifyKind(entry.name), label: classifyLabel(entry.name), language: detectLanguage(entry.name) });
    } else {
      skippedFiles.push(entry.relativePath);
    }
  }

  const wg: WorkGroup[] = [];
  for (const [fp, g] of folders) {
    if (g.tracks.length === 0) continue;
    g.tracks.sort((a, b) => a.trackNumber - b.trackNumber);
    wg.push({ folderName: fp === '__root__' ? '导入作品' : fp.split('/').pop()!, folderPath: fp, tracks: g.tracks, coverPath: g.coverPath, subtitleFiles: g.subtitleFiles });
  }
  return { workGroups: wg, totalFiles: entries.length, skippedFiles };
}

async function findDuplicates(group: WorkGroup) {
  const c: { id: string; displayTitle: string; workCode: string | null }[] = [];
  const cm = group.folderName.match(/\\b(RJ|VJ|BJ)\\d{4,}\\b/i);
  const fc = cm ? cm[0].toUpperCase() : null;
  if (fc) { const r = await prisma.work.findMany({ where: { workCode: fc }, select: { id: true, displayTitle: true, workCode: true } }); c.push(...r); }
  if (c.length === 0) { const tk = group.folderName.substring(0, 20); const tm = await prisma.work.findMany({ where: { displayTitle: { contains: tk } }, select: { id: true, displayTitle: true, workCode: true }, take: 5 }); for (const m of tm) { if (lcp(group.folderName, m.displayTitle).length >= 10 || cor(group.folderName, m.displayTitle) > 0.7) c.push(m); } }
  return c;
}
function lcp(a: string, b: string) { let i = 0; const l = Math.min(a.length, b.length); while (i < l && a[i] === b[i]) i++; return a.substring(0, i); }
function cor(a: string, b: string) { const s = a.length < b.length ? a : b; const l = s === a ? b : a; if (s.length === 0) return 0; const set = new Set(l); let o = 0; for (const ch of s) if (set.has(ch)) o++; return o / s.length; }

const GL: Record<string, string> = { mp3: 'MP3', wav: 'WAV', flac: 'FLAC', m4a: 'M4A', ogg: 'OGG', 'seあり': '有 SE', 'seなし': '无 SE', 'no se': '无 SE', voice: '语音', bonus: '特典', extra: '特典', '特典': '特典', '本篇': '本篇', '台本': '台本', '字幕': '字幕' };
const GP: Record<string, number> = { mp3: 10, wav: 11, flac: 12, m4a: 13, ogg: 14, 'seあり': 20, 'seなし': 21, 'no se': 21, voice: 30, '本篇': 40, '特典': 50, bonus: 50, extra: 50, '台本': 60, '字幕': 70 };
function ngLabel(p: string) { return GL[p.toLowerCase()] || p; }
function ngSort(p: string) { const v = GP[p.toLowerCase()]; return v != null ? String(v).padStart(3, '0') : '999'; }

export async function runImport(input: ImportInput): Promise<ImportResult> {
  const { rootPath } = input;
  let repo = input.repositoryId ? await prisma.storageRepository.findUnique({ where: { id: input.repositoryId } }) : await prisma.storageRepository.findFirst({ where: { type: 'local', isEnabled: true } });
  if (!repo) repo = await prisma.storageRepository.create({ data: { name: '本地媒体库', type: 'local', rootPath, isEnabled: true } });

  const { workGroups, totalFiles, skippedFiles } = await scanDirectory(rootPath, input.groupByTop);
  let fw = 0, ft = 0, rc = 0, fs = 0;
  const errors: string[] = [];
  const reviewCandidates: ImportResult['reviewCandidates'] = [];

  for (const group of workGroups) {
    try {
      const dups = await findDuplicates(group);
      if (dups.length > 0) { rc++; reviewCandidates!.push({ folderName: group.folderName, folderCode: null, candidateWorks: dups.map((d) => ({ id: d.id, title: d.displayTitle, code: d.workCode })) }); continue; }
      const cm = group.folderName.match(/\\b(RJ|VJ|BJ)\\d{4,}\\b/i);
      const fc = cm ? cm[0].toUpperCase() : null;
      const cn = group.folderPath.split('/')[0] || null;
      let ci: string | null = null;
      if (cn) { const c = await prisma.circle.upsert({ where: { name: cn }, update: {}, create: { name: cn } }); ci = c.id; }
      const work = await prisma.work.create({ data: { displayTitle: group.folderName, originalTitle: group.folderName, workCode: fc, coverPath: group.coverPath || null, circleId: ci, trackCount: group.tracks.length } });
      fw++;

      for (const tc of group.tracks) {
        try {
          const track = await prisma.track.create({ data: { workId: work.id, trackNumber: tc.trackNumber, title: tc.filename.replace(/\\.[^.]+$/, '') } });
          // Preserve the FULL relative group path (all segments between work root and filename)
          const parts = tc.relativePath.split('/');
          // Full group path: everything between top-level segment and filename
          const groupPath = parts.length > 2 ? parts.slice(1, parts.length - 1).join('/') : null;
          const groupLabel = groupPath ? groupPath.split('/').map(ngLabel).join(' / ') : null;
          const sortKey = groupPath ? groupPath.split('/').map(ngSort).join(':') : null;
          await prisma.trackFile.create({ data: { trackId: track.id, repositoryId: repo?.id || '', filePath: tc.relativePath, fileSize: tc.size, isAvailable: true, groupPath, groupLabel, sortKey } });
          ft++;
        } catch (e) { errors.push(`曲目 "${tc.filename}": ${e instanceof Error ? e.message : String(e)}`); }
      }

      // Subtitle files — create TrackSubtitle records
      for (const sf of group.subtitleFiles) {
        try {
          // Create a dummy track to attach subtitle to, or use first track
          const firstTrack = await prisma.track.findFirst({ where: { workId: work.id }, orderBy: { trackNumber: 'asc' } });
          if (firstTrack) {
            await (prisma as any).trackSubtitle.create({
              data: { trackId: firstTrack.id, workId: work.id, repositoryId: repo?.id || '', filePath: sf.relativePath, kind: sf.kind, language: sf.language, label: sf.label, isDefault: false },
            });
            fs++;
          }
        } catch (e) { errors.push(`字幕 "${sf.filename}": ${e instanceof Error ? e.message : String(e)}`); }
      }
    } catch (e) { errors.push(`作品 "${group.folderName}": ${e instanceof Error ? e.message : String(e)}`); }
  }

  const status = rc > 0 ? 'review' : errors.length > 0 ? 'done_with_errors' : 'done';
  return { status, foundWorks: fw, foundTracks: ft, reviewCount: rc, totalFiles, skippedFiles: skippedFiles.length, errors, foundSubtitles: fs, reviewCandidates: rc > 0 ? reviewCandidates : undefined };
}
