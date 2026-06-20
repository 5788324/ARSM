/**
 * Shared import service — Phase 4: group support + subtitle recognition.
 */

import { prisma } from '@/lib/prisma';
import { LocalAdapter, isAudioFile } from '@/lib/repository/local';

export interface ImportInput {
  repositoryId?: string;
  rootPath: string;
  groupByTop?: boolean;
}

export interface WorkGroup {
  folderName: string;
  folderPath: string;
  tracks: { relativePath: string; filename: string; trackNumber: number; size: number }[];
  coverPath?: string;
}

export interface ImportResult {
  status: 'done' | 'review' | 'done_with_errors' | 'failed';
  foundWorks: number;
  foundTracks: number;
  reviewCount: number;
  totalFiles: number;
  skippedFiles: number;
  errors: string[];
  reviewCandidates?: { folderName: string; folderCode: string | null; candidateWorks: { id: string; title: string; code: string | null }[] }[];
}

export async function scanDirectory(rootPath: string, groupByTop = false) {
  const adapter = new LocalAdapter('import', rootPath);
  const entries = await adapter.listFiles('.');
  const folders = new Map<string, { tracks: WorkGroup['tracks']; coverPath?: string }>();
  const skippedFiles: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const firstSlash = entry.relativePath.indexOf('/');
    const folderPath = groupByTop && firstSlash > 0
      ? entry.relativePath.substring(0, firstSlash)
      : entry.relativePath.substring(0, entry.relativePath.lastIndexOf('/'));
    const folderKey = folderPath || '__root__';
    if (!folders.has(folderKey)) folders.set(folderKey, { tracks: [] });
    const group = folders.get(folderKey)!;

    if (isAudioFile(entry.name)) {
      const trackMatch = entry.name.match(/^(\d+)/);
      const trackNumber = trackMatch ? parseInt(trackMatch[1], 10) : group.tracks.length + 1;
      group.tracks.push({ relativePath: entry.relativePath, filename: entry.name, trackNumber, size: entry.size });
    } else if (/^cover\.(jpg|jpeg|png|webp)$/i.test(entry.name) || /^folder\.(jpg|jpeg|png)$/i.test(entry.name) || /^jacket\.(jpg|jpeg|png)$/i.test(entry.name)) {
      group.coverPath = entry.relativePath;
    } else {
      skippedFiles.push(entry.relativePath);
    }
  }

  const workGroups: WorkGroup[] = [];
  for (const [folderPath, group] of folders) {
    if (group.tracks.length === 0) continue;
    group.tracks.sort((a, b) => a.trackNumber - b.trackNumber);
    workGroups.push({
      folderName: folderPath === '__root__' ? '导入作品' : folderPath.split('/').pop()!,
      folderPath,
      tracks: group.tracks,
      coverPath: group.coverPath,
    });
  }
  return { workGroups, totalFiles: entries.length, skippedFiles };
}

async function findDuplicates(group: WorkGroup) {
  const candidates: { id: string; displayTitle: string; workCode: string | null }[] = [];
  const codeMatch = group.folderName.match(/\b(RJ|VJ|BJ)\d{4,}\b/i);
  const folderCode = codeMatch ? codeMatch[0].toUpperCase() : null;
  if (folderCode) {
    const cm = await prisma.work.findMany({ where: { workCode: folderCode }, select: { id: true, displayTitle: true, workCode: true } });
    candidates.push(...cm);
  }
  if (candidates.length === 0) {
    const titleKey = group.folderName.substring(0, 20);
    const tm = await prisma.work.findMany({ where: { displayTitle: { contains: titleKey } }, select: { id: true, displayTitle: true, workCode: true }, take: 5 });
    for (const m of tm) {
      const cp = longestCommonPrefix(group.folderName, m.displayTitle);
      const or = charOverlapRatio(group.folderName, m.displayTitle);
      if (cp.length >= 10 || or > 0.7) candidates.push(m);
    }
  }
  return candidates;
}

function longestCommonPrefix(a: string, b: string) { let i = 0; const l = Math.min(a.length, b.length); while (i < l && a[i] === b[i]) i++; return a.substring(0, i); }
function charOverlapRatio(a: string, b: string) {
  const s = a.length < b.length ? a : b;
  const l = a.length < b.length ? b : a;
  if (s.length === 0) return 0;
  const set = new Set(l);
  let o = 0;
  for (const c of s) if (set.has(c)) o++;
  return o / s.length;
}

const GROUP_LABEL: Record<string, string> = {
  mp3: 'MP3', wav: 'WAV', flac: 'FLAC', m4a: 'M4A', ogg: 'OGG',
  'seあり': '有 SE', 'seなし': '无 SE', 'no se': '无 SE',
  voice: '语音', bonus: '特典', extra: '特典', '特典': '特典',
  '本篇': '本篇', '台本': '台本', '字幕': '字幕',
};
const GROUP_PRIO: Record<string, number> = {
  mp3: 10, wav: 11, flac: 12, m4a: 13, ogg: 14,
  'seあり': 20, 'seなし': 21, 'no se': 21,
  voice: 30, '本篇': 40, '特典': 50, bonus: 50, extra: 50,
  '台本': 60, '字幕': 70,
};

function normGroupLabel(p: string) { return GROUP_LABEL[p.toLowerCase()] || p; }
function normGroupSort(p: string) { const v = GROUP_PRIO[p.toLowerCase()]; return v != null ? String(v).padStart(3, '0') : '999'; }

export async function runImport(input: ImportInput): Promise<ImportResult> {
  const { rootPath } = input;
  let repo = input.repositoryId
    ? await prisma.storageRepository.findUnique({ where: { id: input.repositoryId } })
    : await prisma.storageRepository.findFirst({ where: { type: 'local', isEnabled: true } });
  if (!repo) {
    repo = await prisma.storageRepository.create({ data: { name: '本地媒体库', type: 'local', rootPath, isEnabled: true } });
  }

  const { workGroups, totalFiles, skippedFiles } = await scanDirectory(rootPath, input.groupByTop);
  let foundWorks = 0, foundTracks = 0, reviewCount = 0;
  const errors: string[] = [];
  const reviewCandidates: ImportResult['reviewCandidates'] = [];

  for (const group of workGroups) {
    try {
      const duplicates = await findDuplicates(group);
      if (duplicates.length > 0) {
        reviewCount++;
        reviewCandidates!.push({ folderName: group.folderName, folderCode: null, candidateWorks: duplicates.map((d) => ({ id: d.id, title: d.displayTitle, code: d.workCode })) });
        continue;
      }
      const codeMatch = group.folderName.match(/\b(RJ|VJ|BJ)\d{4,}\b/i);
      const folderCode = codeMatch ? codeMatch[0].toUpperCase() : null;
      const circleName = group.folderPath.split('/')[0] || null;
      let circleId: string | null = null;
      if (circleName) { const c = await prisma.circle.upsert({ where: { name: circleName }, update: {}, create: { name: circleName } }); circleId = c.id; }
      const work = await prisma.work.create({ data: { displayTitle: group.folderName, originalTitle: group.folderName, workCode: folderCode, coverPath: group.coverPath || null, circleId, trackCount: group.tracks.length } });
      foundWorks++;

      for (const tc of group.tracks) {
        try {
          const track = await prisma.track.create({ data: { workId: work.id, trackNumber: tc.trackNumber, title: tc.filename.replace(/\.[^.]+$/, '') } });
          const parts = tc.relativePath.split('/');
          const groupPath = parts.length > 2 ? parts[parts.length - 2] : null;
          const groupLabel = groupPath ? normGroupLabel(groupPath) : null;
          const sortKey = groupPath ? normGroupSort(groupPath) : null;
          await prisma.trackFile.create({ data: { trackId: track.id, repositoryId: repo?.id || '', filePath: tc.relativePath, fileSize: tc.size, isAvailable: true, groupPath, groupLabel, sortKey } });
          foundTracks++;
        } catch (e) { errors.push(`曲目 "${tc.filename}": ${e instanceof Error ? e.message : String(e)}`); }
      }
    } catch (e) { errors.push(`作品 "${group.folderName}": ${e instanceof Error ? e.message : String(e)}`); }
  }

  const status = reviewCount > 0 ? 'review' : errors.length > 0 ? 'done_with_errors' : 'done';
  return { status, foundWorks, foundTracks, reviewCount, totalFiles, skippedFiles: skippedFiles.length, errors, reviewCandidates: reviewCandidates!.length > 0 ? reviewCandidates : undefined };
}
