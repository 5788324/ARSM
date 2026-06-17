import { promises as fs } from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import {
  RepositoryAdapter,
  FileEntry,
  FileMetadata,
} from './types';

const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  '.mp3', '.m4a', '.flac', '.wav', '.ogg', '.opus', '.aac', '.wma',
]);

const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.bmp',
]);

/** Regex matching cover image filenames */
const COVER_PATTERNS = [
  /^cover\.(jpg|jpeg|png|webp)$/i,
  /^folder\.(jpg|jpeg|png)$/i,
  /^jacket\.(jpg|jpeg|png)$/i,
  /^front\.(jpg|jpeg|png)$/i,
];

export function isAudioFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_AUDIO_EXTENSIONS.has(ext);
}

export function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_IMAGE_EXTENSIONS.has(ext);
}

export function isCoverImage(filename: string): boolean {
  return COVER_PATTERNS.some((pattern) => pattern.test(filename));
}

/**
 * LocalFilesystemAdapter — reads files directly from disk.
 */
export class LocalAdapter implements RepositoryAdapter {
  readonly name: string;
  readonly type = 'local' as const;
  private rootPath: string;

  constructor(name: string, rootPath: string) {
    this.name = name;
    this.rootPath = rootPath;
  }

  private resolve(p: string): string {
    return path.join(this.rootPath, p);
  }

  async listFiles(subPath: string): Promise<FileEntry[]> {
    const results: FileEntry[] = [];
    const base = this.resolve(subPath);

    const walk = async (dir: string): Promise<void> => {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return; // skip inaccessible directories
      }

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(base, fullPath);

        let stat;
        try {
          stat = await fs.stat(fullPath);
        } catch {
          continue;
        }

        results.push({
          relativePath: relativePath.replace(/\\/g, '/'),
          name: entry.name,
          size: stat.size,
          isDirectory: entry.isDirectory(),
          modifiedAt: stat.mtime,
        });

        if (entry.isDirectory()) {
          await walk(fullPath);
        }
      }
    };

    await walk(base);
    return results;
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(filePath));
      return true;
    } catch {
      return false;
    }
  }

  async resolvePath(filePath: string): Promise<string> {
    return this.resolve(filePath);
  }

  async getMetadata(filePath: string): Promise<FileMetadata> {
    const fullPath = this.resolve(filePath);
    const stat = await fs.stat(fullPath);
    const ext = path.extname(filePath).toLowerCase();

    const mimeMap: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.flac': 'audio/flac',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.opus': 'audio/opus',
      '.aac': 'audio/aac',
      '.wma': 'audio/x-ms-wma',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };

    return {
      relativePath: filePath,
      size: stat.size,
      mimeType: mimeMap[ext] || 'application/octet-stream',
      modifiedAt: stat.mtime,
    };
  }

  async readBuffer(filePath: string): Promise<Buffer> {
    return fs.readFile(this.resolve(filePath));
  }
}
