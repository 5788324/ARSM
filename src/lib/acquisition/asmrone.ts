/**
 * Backward-compatible re-exports.
 * @deprecated Use '@/lib/acquisition/providers/asmrone' directly.
 */
export { AsmrOneProvider } from './providers/asmrone';

import { AsmrOneProvider } from './providers/asmrone';
import type { DownloadProgress } from './types';

const provider = new AsmrOneProvider();

export async function inspect(input: string) {
  return provider.inspect(input);
}

export async function downloadWork(
  input: string,
  targetDir: string,
  onFileProgress?: (file: DownloadProgress) => void,
) {
  return provider.download(input, targetDir, {
    onFileStart: (path) => onFileProgress?.({ path, size: 0, downloaded: 0, status: 'downloading' }),
    onFileDone: (path) => onFileProgress?.({ path, size: 0, downloaded: 0, status: 'done' }),
    onFileError: (path, error) => onFileProgress?.({ path, size: 0, downloaded: 0, status: 'failed', error }),
  });
}

export type { DownloadSummary, DownloadProgress } from './types';
