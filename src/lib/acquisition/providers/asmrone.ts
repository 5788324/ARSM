/**
 * AsmrOneProvider — asmr.one API integration provider.
 *
 * Implements AcquisitionProvider interface.
 */

import {
  AcquisitionProvider,
  InspectResult,
  InspectFile,
  DownloadSummary,
  DownloadProgress,
  ProgressHooks,
} from '../types';

import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname, join, resolve, normalize } from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

const API_BASE = 'https://api.asmr-300.com';
const VALID_PREFIXES = ['RJ', 'VJ', 'BJ'];
const ALLOWED_ROOTS = ['C:/Users/YANG/Music/arsm.one', process.env.LIBRARY_ROOT || ''].filter(Boolean);

let cachedToken: string | null = null;
let tokenExpiry = 0;

export class AsmrOneProvider implements AcquisitionProvider {
  readonly id = 'asmrone';
  readonly displayName = 'asmr.one (API)';

  supports(input: string): boolean {
    try {
      normalizeId(input);
      return true;
    } catch {
      return false;
    }
  }

  async inspect(input: string): Promise<InspectResult> {
    const { sourceId, workId } = normalizeId(input);
    const [work, tracks] = await Promise.all([
      fetchJson(`/api/work/${workId}`),
      fetchJson(`/api/tracks/${workId}?v=2`),
    ]);

    const files = flattenNodes(tracks as unknown[]);
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    return {
      sourceId, workId,
      title: String((work as Record<string, unknown>).title ?? ''),
      release: String((work as Record<string, unknown>).release ?? ''),
      hasSubtitle: Boolean((work as Record<string, unknown>).has_subtitle),
      fileCount: files.length, totalSize, files,
    };
  }

  async download(input: string, targetDir: string, hooks?: ProgressHooks): Promise<DownloadSummary> {
    const validatedDir = validateTargetDir(targetDir);
    const { sourceId, files } = await this.inspect(input);
    const baseDir = join(validatedDir, sourceId);

    const progress: DownloadProgress[] = files.map((f) => ({
      path: f.path, size: f.size, downloaded: 0, status: 'pending' as const,
    }));

    let bytesDownloaded = 0;

    for (const p of progress) {
      const file = files.find((f) => f.path === p.path)!;
      const url = file.downloadUrl;
      if (!url) { p.status = 'failed'; p.error = '无下载地址'; hooks?.onFileError?.(p.path, p.error); continue; }

      const destPath = join(baseDir, sanitizeRelativePath(p.path));
      p.status = 'downloading';
      hooks?.onFileStart?.(p.path);

      try {
        await downloadFileStream(url, destPath, (dl) => {
          p.downloaded = dl;
          hooks?.onFileProgress?.(p.path, dl, p.size);
        });
        p.status = 'done'; p.downloaded = p.size; bytesDownloaded += p.size;
        hooks?.onFileDone?.(p.path);
      } catch (err) {
        p.status = 'failed';
        p.error = err instanceof Error ? err.message : '未知错误';
        hooks?.onFileError?.(p.path, p.error ?? '');
      }
    }

    return {
      total: progress.length,
      done: progress.filter((p) => p.status === 'done').length,
      failed: progress.filter((p) => p.status === 'failed').length,
      skipped: progress.filter((p) => p.status === 'skipped').length,
      bytesDownloaded,
      files: progress,
      errors: progress.filter((p) => p.status === 'failed').map((p) => `${p.path}: ${p.error}`),
    };
  }
}

// ─── Internal helpers (same as before, adapted to types.ts) ───

export function normalizeId(input: string): { sourceId: string; workId: string } {
  const trimmed = input.trim().toUpperCase();
  const codeMatch = trimmed.match(/^(RJ|VJ|BJ)(\d{6,})$/);
  if (codeMatch) return { sourceId: `${codeMatch[1]}${codeMatch[2]}`, workId: codeMatch[2] };
  const urlMatch = trimmed.match(/\b(RJ|VJ|BJ)(\d{6,})\b/i);
  if (urlMatch) return { sourceId: `${urlMatch[1].toUpperCase()}${urlMatch[2]}`, workId: urlMatch[2] };
  throw new Error(`无法识别的作品编号: "${input}"。支持格式: RJ123456 / VJ123456 / BJ123456（至少6位数字）`);
}

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://asmr.one', 'Referer': 'https://asmr.one/', 'User-Agent': 'Mozilla/5.0' },
    body: JSON.stringify({ name: 'guest', password: 'guest' }),
  });
  if (!res.ok) throw new Error(`AsmrOne login failed: HTTP ${res.status}`);
  const data = await res.json();
  cachedToken = data.token;
  if (!cachedToken) throw new Error('AsmrOne login: no token');
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return cachedToken;
}

async function fetchJson(path: string): Promise<unknown> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Origin': 'https://asmr.one', 'Referer': 'https://asmr.one/', 'User-Agent': 'Mozilla/5.0' },
  });
  if (!res.ok) throw new Error(`AsmrOne API ${path}: HTTP ${res.status}`);
  return res.json();
}

export function flattenNodes(nodes: unknown[], base = ''): InspectFile[] {
  const files: InspectFile[] = [];
  for (const n of nodes as Record<string, unknown>[]) {
    const title = String(n.title ?? '');
    const p = base ? `${base}/${title}` : title;
    if (n.type === 'folder') { files.push(...flattenNodes((n.children as unknown[]) || [], p)); continue; }
    files.push({
      path: p, type: String(n.type ?? 'file'), size: Number(n.size ?? 0),
      downloadUrl: String(n.mediaDownloadUrl ?? n.mediaStreamUrl ?? ''),
      streamUrl: String(n.mediaStreamUrl ?? ''),
    });
  }
  return files;
}

function sanitizeRelativePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\/+/, '').split('/').filter((s) => s && s !== '..').join('/');
}

function validateTargetDir(targetDir: string): string {
  const resolved = resolve(normalize(targetDir));
  const normalizedTarget = resolved.replace(/\\/g, '/').replace(/\/+$/, '') + '/';
  const allowed = ALLOWED_ROOTS.some((root) => {
    const r = resolve(normalize(root)).replace(/\\/g, '/').replace(/\/+$/, '') + '/';
    return normalizedTarget.startsWith(r);
  });
  if (!allowed) throw new Error(`下载目录 "${targetDir}" 不在允许范围内`);
  return resolved;
}

export async function downloadFileStream(url: string, destPath: string, onProgress?: (dl: number) => void, retries = 3): Promise<void> {
  await mkdir(dirname(destPath), { recursive: true });
  let lastErr: Error | null = null;
  for (let a = 0; a < retries; a++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 120_000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://asmr.one/' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error('No body');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeReadable = Readable.fromWeb(res.body as any);
      const ws = createWriteStream(destPath, { flags: 'w' });
      let dl = 0;
      nodeReadable.on('data', (chunk: Buffer) => { dl += chunk.length; onProgress?.(dl); });
      await pipeline(nodeReadable, ws);
      clearTimeout(timer);
      return;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (lastErr.message.startsWith('HTTP 4')) throw lastErr;
    }
  }
  throw lastErr || new Error('Download failed');
}
