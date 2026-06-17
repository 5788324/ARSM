/**
 * AsmrOneProvider — direct API integration with asmr.one.
 *
 * Uses the asmr.one REST API (guest login) instead of HTML scraping.
 * API base: https://api.asmr-300.com
 */

import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

const API_BASE = 'https://api.asmr-300.com';

interface AsmrOneFile {
  path: string;
  type: string;
  size: number;
  hash: string;
  mediaDownloadUrl: string;
  mediaStreamUrl: string;
  streamLowQualityUrl: string;
}

interface InspectResult {
  sourceId: string;
  workId: string;
  title: string;
  release: string;
  hasSubtitle: boolean;
  fileCount: number;
  totalSize: number;
  files: AsmrOneFile[];
}

interface DownloadProgress {
  path: string;
  url: string;
  size: number;
  downloaded: number;
  status: 'pending' | 'downloading' | 'done' | 'failed';
  error?: string;
}

let cachedToken: string | null = null;
let tokenExpiry = 0;

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

  if (!res.ok) throw new Error(`AsmrOne login failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.token;
  if (!cachedToken) throw new Error('AsmrOne login: no token returned');
  tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 min
  return cachedToken;
}

function normalizeId(input: string): { sourceId: string; workId: string } {
  const codeMatch = input.match(/\b(RJ|VJ|BJ)(\d+)\b/i);
  if (codeMatch) {
    const sourceId = `${codeMatch[1].toUpperCase()}${codeMatch[2]}`;
    return { sourceId, workId: codeMatch[2] };
  }
  // Try extracting just digits
  const digits = input.replace(/\D/g, '');
  if (digits.length >= 6) {
    return { sourceId: `RJ${digits}`, workId: digits };
  }
  throw new Error(`Cannot extract work ID from: ${input}`);
}

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
  if (!res.ok) throw new Error(`AsmrOne API ${path}: ${res.status}`);
  return res.json();
}

function flattenNodes(nodes: unknown[], basePath = ''): AsmrOneFile[] {
  const files: AsmrOneFile[] = [];
  for (const node of nodes as Record<string, unknown>[]) {
    const title = (node.title as string) || '';
    const currentPath = basePath ? `${basePath}/${title}` : title;
    if (node.type === 'folder') {
      files.push(...flattenNodes((node.children as unknown[]) || [], currentPath));
      continue;
    }
    files.push({
      path: currentPath,
      type: (node.type as string) || 'file',
      size: (node.size as number) || 0,
      hash: (node.hash as string) || '',
      mediaDownloadUrl: (node.mediaDownloadUrl as string) || '',
      mediaStreamUrl: (node.mediaStreamUrl as string) || '',
      streamLowQualityUrl: (node.streamLowQualityUrl as string) || '',
    });
  }
  return files;
}

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
    title: (work.title as string) || '',
    release: (work.release as string) || '',
    hasSubtitle: (work.has_subtitle as boolean) || false,
    fileCount: files.length,
    totalSize,
    files,
  };
}

/** Download a single file from its mediaDownloadUrl */
async function downloadFile(url: string, destPath: string, onProgress?: (downloaded: number) => void): Promise<void> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'https://asmr.one/',
    },
  });

  if (!res.ok || !res.body) throw new Error(`Download failed: ${res.status}`);

  await mkdir(dirname(destPath), { recursive: true });

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let downloaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    downloaded += value.length;
    onProgress?.(downloaded);
  }

  const buffer = Buffer.concat(chunks);
  await writeFile(destPath, buffer);
}

/** Download all files for a work into a target directory */
export async function downloadWork(
  input: string,
  targetDir: string,
  onFileProgress?: (file: DownloadProgress) => void,
): Promise<{ files: DownloadProgress[]; errors: string[] }> {
  const { sourceId, files } = await inspect(input);

  const progress: DownloadProgress[] = files.map((f) => ({
    path: f.path,
    url: f.mediaDownloadUrl,
    size: f.size,
    downloaded: 0,
    status: 'pending' as const,
  }));

  for (const p of progress) {
    if (!p.url) {
      p.status = 'failed';
      p.error = 'No download URL';
      onFileProgress?.(p);
      continue;
    }

    p.status = 'downloading';
    onFileProgress?.(p);

    try {
      const destPath = `${targetDir}/${sourceId}/${p.path}`;
      await downloadFile(p.url, destPath, (dl) => { p.downloaded = dl; });
      p.status = 'done';
      p.downloaded = p.size;
    } catch (err) {
      p.status = 'failed';
      p.error = err instanceof Error ? err.message : 'Unknown error';
    }
    onFileProgress?.(p);
  }

  const errors = progress.filter((p) => p.status === 'failed').map((p) => `${p.path}: ${p.error}`);
  return { files: progress, errors };
}
