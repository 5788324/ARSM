/**
 * ImportScanner — scans a repository for audio works and tracks.
 */

import { prisma } from '@/lib/prisma';
import { LocalAdapter, isAudioFile, isImageFile, isCoverImage } from '@/lib/repository/local';
import type { FileEntry } from '@/lib/repository/types';

export interface ScanResult {
  /** Detected work groups (folder name → tracks inside) */
  workGroups: WorkGroup[];
  /** Total files scanned */
  totalFiles: number;
  /** Files that couldn't be categorized */
  skippedFiles: string[];
  /** Errors encountered */
  errors: string[];
}

export interface WorkGroup {
  /** Suggested work title (derived from folder name) */
  folderName: string;
  /** Relative path of the folder */
  folderPath: string;
  /** Audio tracks found */
  tracks: TrackCandidate[];
  /** Cover image path (if found) */
  coverPath?: string;
}

export interface TrackCandidate {
  relativePath: string;
  filename: string;
  trackNumber: number;
  size: number;
}

/**
 * Scan a local directory and group files into works by folder structure.
 */
export async function scanLocalDirectory(
  rootPath: string,
  adapter: LocalAdapter,
): Promise<ScanResult> {
  const errors: string[] = [];
  const skippedFiles: string[] = [];
  const folders = new Map<string, { tracks: TrackCandidate[]; coverPath?: string }>();

  let totalFiles = 0;

  try {
    const entries = await adapter.listFiles(rootPath);
    totalFiles = entries.length;

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const folderPath = entry.relativePath.substring(
        0,
        entry.relativePath.lastIndexOf('/'),
      );
      const folderKey = folderPath || '__root__';
      const folderName = folderPath.split('/').pop() || 'Unknown Work';

      if (!folders.has(folderKey)) {
        folders.set(folderKey, { tracks: [], coverPath: undefined });
      }

      const group = folders.get(folderKey)!;

      if (isAudioFile(entry.name)) {
        // Extract track number from filename: "01 - Title.mp3", "Track 1.flac", etc.
        const trackMatch = entry.name.match(/^(\d+)/);
        const trackNumber = trackMatch ? parseInt(trackMatch[1], 10) : group.tracks.length + 1;

        group.tracks.push({
          relativePath: entry.relativePath,
          filename: entry.name,
          trackNumber,
          size: entry.size,
        });
      } else if (isImageFile(entry.name) && isCoverImage(entry.name)) {
        group.coverPath = entry.relativePath;
      } else {
        skippedFiles.push(entry.relativePath);
      }
    }
  } catch (err) {
    errors.push(`Failed to scan directory: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Sort tracks by track number
  const workGroups: WorkGroup[] = [];
  for (const [folderPath, group] of folders) {
    if (group.tracks.length === 0) continue;

    group.tracks.sort((a, b) => a.trackNumber - b.trackNumber);

    workGroups.push({
      folderName: folderPath === '__root__' ? 'Imported Works' : folderPath.split('/').pop()!,
      folderPath,
      tracks: group.tracks,
      coverPath: group.coverPath,
    });
  }

  return { workGroups, totalFiles, skippedFiles, errors };
}
