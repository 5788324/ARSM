/**
 * AsmrOneProvider — direct API integration with asmr.one.
 *
 * Uses the asmr.one REST API (guest login) instead of HTML scraping.
 * API base: https://api.asmr-300.com
 *
 * Download files via CDN (raw/fast/large.kiko-play-niptan.one).
 */

import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname, join, resolve, normalize } from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const API_BASE = 'https://api.asmr-300.com';

/** Recognized work ID prefixes */
const VALID_PREFIXES = ['RJ', 'VJ', 'BJ'];

/** Allowed download root directories — downloads only go under these paths */
const ALLOWED_ROOTS: string[] = [
  'C:/Users/YANG/Music/arsm.one',
  process.env.LIBRARY_ROOT || '',
].filter(Boolean);

interface AsmrOneFile {
  path: string;
  type: string;
  size: number;
  hash: string;
  mediaDownloadUrl: string;
  mediaStreamUrl: string;
  streamLowQualityUrl: string;
}

export interface InspectResult {
  sourceId: string;
  workId: string;
  title: string;
  release: string;
  hasSubtitle: boolean;
  fileCount: number;
  totalSize: number;
  files: AsmrOneFile[];
}

export interface DownloadProgress {
  path: string;
  size: number;
  downloaded: number;
  status: 'pending' | 'downloading' | 'done' | 'failed' | 'skipped';
  error?: string;
  httpStatus?: number;
  retries?: number;
}

export interface DownloadSummary {
  total: number;
  done: number;
  failed: number;
  skipped: number;
  bytesDownloaded: number;
  files: DownloadProgress[];
  errors: string[];
}

let cachedToken: string | null = null;
let tokenExpiry = 0;

// ─── Auth ────────────────────────────────────────────────

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://asmr.one',
      'Referer': 'https://asmr.one/',
      'User-Agent': 'Mozilla/5.0',
    },
    body: JSON.stringify({ name: 'guest', password: 'guest' }),
  });

  if (!res.ok) throw new Error(`AsmrOne login failed: HTTP ${res.status}`);
  const data = await res.json();
  cachedToken = data.token;
  if (!cachedToken) throw new Error('AsmrOne login: no token in response');
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return cachedToken;
}

// ─── ID normalization ────────────────────────────────────

/** Parse user input into (sourceId, numeric workId). Throws on invalid input. */
export function normalizeId(input: string): { sourceId: string; workId: string } {
  const trimmed = input.trim().toUpperCase();

  // Explicit prefix match
  const codeMatch = trimmed.match(/^(RJ|VJ|BJ)(\d{6,})$/);
  if (codeMatch) {
    return { sourceId: `${codeMatch[1]}${codeMatch[2]}`, workId: codeMatch[2] };
  }

  // URL pattern: extract RJ code from URL
  const urlMatch = trimmed.match(/\b(RJ|VJ|BJ)(\d{6,})\b/i);
  if (urlMatch) {
    return { sourceId: `${urlMatch[1].toUpperCase()}${urlMatch[2]}`, workId: urlMatch[2] };
  }

  throw new Error(
    `无法识别的作品编号: "${input}"。支持格式: RJ123456 / VJ123456 / BJ123456（至少6位数字）`,
  );
}

// ─── API helpers ─────────────────────────────────────────

async function fetchJson(path: string): Promise<unknown> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Origin': 'https://asmr.one',
      'Referer': 'https://asmr.one/',
      'User-Agent': 'Mozilla/5.0',
    },
  });
  if (!res.ok) throw new Error(`AsmrOne API ${path}: HTTP ${res.status}`);
  return res.json();
}

// ─── File tree flattening ────────────────────────────────

/** Flatten nested folder tree from asmr.one tracks API into a flat file list. */
export function flattenNodes(nodes: unknown[], basePath = ''): AsmrOneFile[] {
  const files: AsmrOneFile[] = [];
  for (const node of nodes as Record<string, unknown>[]) {
    const title = String(node.title ?? '');
    const currentPath = basePath ? `${basePath}/${title}` : title;
    if (node.type === 'folder') {
      files.push(...flattenNodes((node.children as unknown[]) || [], currentPath));
      continue;
    }
    files.push({
      path: currentPath,
      type: String(node.type ?? 'file'),
      size: Number(node.size ?? 0),
      hash: String(node.hash ?? ''),
      mediaDownloadUrl: String(node.mediaDownloadUrl ?? ''),
      mediaStreamUrl: String(node.mediaStreamUrl ?? ''),
      streamLowQualityUrl: String(node.streamLowQualityUrl ?? ''),
    });
  }
  return files;
}

// ─── URL resolution ──────────────────────────────────────

/** Pick the best download URL for a file. mediaDownloadUrl preferred. */
function resolveDownloadUrl(file: AsmrOneFile): string {
  return file.mediaDownloadUrl || file.mediaStreamUrl || '';
}

/** Sanitize a relative path — prevent traversal and normalize separators */
function sanitizeRelativePath(p: string): string {
  // Replace backslashes, strip leading slashes, resolve ../
  const cleaned = p.replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = cleaned.split('/').filter((s) => s && s !== '..');
  return segments.join('/');
}

// ─── Inspect ─────────────────────────────────────────────

/** Inspect a work by RJ code — returns file tree without downloading */
export async function inspect(input: string): Promise<InspectResult> {
  const { sourceId, workId } = normalizeId(input);

  const [work, tracks] = await Promise.all([
    fetchJson(`/api/work/${workId}`) as Promise<Record<string, unknown>>,
    fetchJson(`/api/tracks/${workId}?v=2`) as Promise<unknown[]>,
  ]);

  const files = flattenNodes(tracks);
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return {
    sourceId,
    workId,
    title: String(work.title ?? ''),
    release: String(work.release ?? ''),
    hasSubtitle: Boolean(work.has_subtitle),
    fileCount: files.length,
    totalSize,
    files,
  };
}

// ─── Streaming download ──────────────────────────────────

interface DownloadOptions {
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * Download a single file from its URL to destPath using streaming write.
 * No whole-file buffering — data is written to disk as it arrives.
 */
export async function downloadFileStream(
  url: string,
  destPath: string,
  onProgress?: (downloaded: number) => void,
  options: DownloadOptions = {},
): Promise<void> {
  const { timeoutMs = 120_000, maxRetries = 3 } = options;

  await mkdir(dirname(destPath), { recursive: true });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://asmr.one/',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      if (!res.body) {
        throw new Error('No response body');
      }

      // Convert Web ReadableStream to Node Readable
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeReadable = Readable.fromWeb(res.body as any);

      const writeStream = createWriteStream(destPath, { flags: 'w' });
      let downloaded = 0;

      nodeReadable.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        onProgress?.(downloaded);
      });

      await pipeline(nodeReadable, writeStream);
      clearTimeout(timer);
      return; // success
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on HTTP 4xx (client errors)
      if (lastError.message.startsWith('HTTP 4')) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error('Download failed after retries');
}

// ─── Download work ───────────────────────────────────────

/** Validate targetDir is within allowed roots */
function validateTargetDir(targetDir: string): string {
  const resolved = resolve(normalize(targetDir));
  const allowed = ALLOWED_ROOTS.some((root) => {
    const resolvedRoot = resolve(normalize(root));
    return resolved.startsWith(resolvedRoot);
  });

  if (!allowed) {
    throw new Error(
      `下载目录 "${targetDir}" 不在允许范围内。允许的根目录: ${ALLOWED_ROOTS.join(', ')}`,
    );
  }
  return resolved;
}

/** Download all files for a work into a target directory */
export async function downloadWork(
  input: string,
  targetDir: string,
  onFileProgress?: (file: DownloadProgress) => void,
): Promise<DownloadSummary> {
  const validatedDir = validateTargetDir(targetDir);
  const { sourceId, files } = await inspect(input);
  const baseDir = join(validatedDir, sourceId);

  const progress: DownloadProgress[] = files.map((f) => ({
    path: f.path,
    size: f.size,
    downloaded: 0,
    status: 'pending' as const,
  }));

  let bytesDownloaded = 0;

  for (const p of progress) {
    const url = resolveDownloadUrl(files.find((f) => f.path === p.path)!);

    if (!url) {
      p.status = 'failed';
      p.error = '无下载地址（mediaDownloadUrl 和 mediaStreamUrl 均为空）';
      onFileProgress?.(p);
      continue;
    }

    const destPath = join(baseDir, sanitizeRelativePath(p.path));

    p.status = 'downloading';
    onFileProgress?.(p);

    try {
      await downloadFileStream(url, destPath, (dl) => {
        p.downloaded = dl;
      });
      p.status = 'done';
      p.downloaded = p.size;
      bytesDownloaded += p.size;
    } catch (err) {
      p.status = 'failed';
      p.error = err instanceof Error ? err.message : '未知错误';
      if (err instanceof Error && err.message.startsWith('HTTP ')) {
        p.httpStatus = parseInt(err.message.slice(5), 10);
      }
    }
    onFileProgress?.(p);
  }

  const done = progress.filter((p) => p.status === 'done').length;
  const failed = progress.filter((p) => p.status === 'failed').length;
  const skipped = progress.filter((p) => p.status === 'skipped').length;
  const errors = progress.filter((p) => p.status === 'failed').map((p) => `${p.path}: ${p.error}`);

  return { total: progress.length, done, failed, skipped, bytesDownloaded, files: progress, errors };
}
