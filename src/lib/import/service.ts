/**
 * Shared import service 鈥?usable by both /api/import route
 * and the acquisition runner.
 *
 * Takes a repository adapter + scan path, runs the full import
 * pipeline (scan 鈫?duplicate detection 鈫?create works/tracks).
 */

import { prisma } from '@/lib/prisma';
import { LocalAdapter, isAudioFile } from '@/lib/repository/local';
import type { FileEntry } from '@/lib/repository/types';

export interface ImportInput {
  repositoryId?: string;
  rootPath: string;  // absolute path to scan
  groupByTop?: boolean;  // group all files under top-level folder (for downloaded works)
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

/**
 * Scan a local directory and group files into works.
 * Set groupByTop to true when scanning a single downloaded work (asmr.one output).
 */
export async function scanDirectory(rootPath: string, groupByTop = false): Promise<{ workGroups: WorkGroup[]; totalFiles: number; skippedFiles: string[] }> {
  const adapter = new LocalAdapter('import', rootPath);
  const entries = await adapter.listFiles('.');

  const folders = new Map<string, { tracks: WorkGroup['tracks']; coverPath?: string }>();
  const skippedFiles: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    // In grouped mode, use top-level segment as folder key
    // e.g. "RJ01584624/01鏈法/mp3/01.mp3" 鈫?folderKey = "RJ01584624"
    const firstSlash = entry.relativePath.indexOf('/');
    const folderPath = groupByTop && firstSlash > 0
      ? entry.relativePath.substring(0, firstSlash)
      : entry.relativePath.substring(0, entry.relativePath.lastIndexOf('/'));
    const folderKey = folderPath || '__root__';

    if (!folders.has(folderKey)) {
      folders.set(folderKey, { tracks: [] });
    }

    const group = folders.get(folderKey)!;

    if (isAudioFile(entry.name)) {
      const trackMatch = entry.name.match(/^(\d+)/);
      const trackNumber = trackMatch ? parseInt(trackMatch[1], 10) : group.tracks.length + 1;
      group.tracks.push({
        relativePath: entry.relativePath,
        filename: entry.name,
        trackNumber,
        size: entry.size,
      });
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

/**
 * Find duplicate candidates for a work group by code or title similarity.
 */
async function findDuplicates(group: WorkGroup): Promise<{ id: string; displayTitle: string; workCode: string | null }[]> {
  const candidates: { id: string; displayTitle: string; workCode: string | null }[] = [];

  const codeMatch = group.folderName.match(/\b(RJ|VJ|BJ)\d{4,}\b/i);
  const folderCode = codeMatch ? codeMatch[0].toUpperCase() : null;

  if (folderCode) {
    const codeMatches = await prisma.work.findMany({
      where: { workCode: folderCode },
      select: { id: true, displayTitle: true, workCode: true },
    });
    candidates.push(...codeMatches);
  }

  if (candidates.length === 0) {
    const titleKey = group.folderName.substring(0, 20);
    const titleMatches = await prisma.work.findMany({
      where: { displayTitle: { contains: titleKey } },
      select: { id: true, displayTitle: true, workCode: true },
      take: 5,
    });
    for (const m of titleMatches) {
      const commonPrefix = longestCommonPrefix(group.folderName, m.displayTitle);
      const overlapRatio = charOverlapRatio(group.folderName, m.displayTitle);
      if (commonPrefix.length >= 10 || overlapRatio > 0.7) {
        candidates.push(m);
      }
    }
  }

  return candidates;
}

function longestCommonPrefix(a: string, b: string): string {
  let i = 0;
  const len = Math.min(a.length, b.length);
  while (i < len && a[i] === b[i]) i++;
  return a.substring(0, i);
}

function charOverlapRatio(a: string, b: string): number {
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  if (shorter.length === 0) return 0;
  const longerSet = new Set(longer);
  let overlap = 0;
  for (const ch of shorter) if (longerSet.has(ch)) overlap++;
  return overlap / shorter.length;
}

/**
 * Run the full import pipeline: scan 鈫?duplicate detect 鈫?create works/tracks.
 * This is the same logic used by POST /api/import.
 */
export async function runImport(input: ImportInput): Promise<ImportResult> {
  const { rootPath } = input;

  let repo = input.repositoryId
    ? await prisma.storageRepository.findUnique({ where: { id: input.repositoryId } })
    : await prisma.storageRepository.findFirst({ where: { type: 'local', isEnabled: true } });

  if (!repo) {
    // Auto-create default repository
    repo = await prisma.storageRepository.create({
      data: { name: '本地媒体库', type: 'local', rootPath, isEnabled: true },
    });
  }

  const { workGroups, totalFiles, skippedFiles } = await scanDirectory(rootPath, input.groupByTop);

  let foundWorks = 0;
  let foundTracks = 0;
  let reviewCount = 0;
  const errors: string[] = [];
  const reviewCandidates: ImportResult['reviewCandidates'] = [];

  for (const group of workGroups) {
    try {
      const duplicates = await findDuplicates(group);
      if (duplicates.length > 0) {
        reviewCount++;
        reviewCandidates!.push({
          folderName: group.folderName,
          folderCode: null,
          candidateWorks: duplicates.map((d) => ({ id: d.id, title: d.displayTitle, code: d.workCode })),
        });
        continue;
      }

      const codeMatch = group.folderName.match(/\b(RJ|VJ|BJ)\d{4,}\b/i);
      const folderCode = codeMatch ? codeMatch[0].toUpperCase() : null;

      const circleName = group.folderPath.split('/')[0] || null;
      let circleId: string | null = null;
      if (circleName) {
        const circle = await prisma.circle.upsert({ where: { name: circleName }, update: {}, create: { name: circleName } });
        circleId = circle.id;
      }

      const work = await prisma.work.create({
        data: {
          displayTitle: group.folderName,
          originalTitle: group.folderName,
          workCode: folderCode,
          coverPath: group.coverPath || null,
          circleId,
          trackCount: group.tracks.length,
        },
      });
      foundWorks++;

      for (const tc of group.tracks) {
        try {
          const track = await prisma.track.create({
            data: {
              workId: work.id,
              trackNumber: tc.trackNumber,
              title: tc.filename.replace(/\.[^.]+$/, ''),
            },
          });

          await prisma.trackFile.create({
            data: {
              trackId: track.id,
              repositoryId: repo?.id || '',
              filePath: tc.relativePath,
              fileSize: tc.size,
              isAvailable: true,
            },
          });
          foundTracks++;
        } catch (e) {
          errors.push(`鏇茬洰 "${tc.filename}": ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    } catch (e) {
      errors.push(`浣滃搧 "${group.folderName}": ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const status = reviewCount > 0 ? 'review' : errors.length > 0 ? 'done_with_errors' : 'done';

  return {
    status, foundWorks, foundTracks, reviewCount, totalFiles,
    skippedFiles: skippedFiles.length, errors,
    reviewCandidates: reviewCandidates!.length > 0 ? reviewCandidates : undefined,
  };
}


