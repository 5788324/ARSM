/**
 * DLsiteProvider — metadata inspection for dlsite.com works.
 *
 * Phase 8: inspect fetches basic metadata (title, circle, tags) from DLsite API.
 * Full file download not yet available (requires auth).
 */
import { AcquisitionProvider, InspectResult, DownloadSummary, ProgressHooks } from '../types';

export class DLsiteProvider implements AcquisitionProvider {
  readonly id = 'dlsite';
  readonly displayName = 'DLsite (元数据)';

  supports(input: string): boolean {
    try {
      const trimmed = input.trim().toUpperCase();
      return /^(RJ|BJ|VJ)\d{6,}$/.test(trimmed);
    } catch { return false; }
  }

  async inspect(input: string): Promise<InspectResult> {
    const sourceId = input.trim().toUpperCase();
    const workId = sourceId.replace(/^(RJ|BJ|VJ)/, '');

    try {
      const res = await fetch(`https://www.dlsite.com/maniax/product/info/ajax?product_id=${sourceId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Referer': 'https://www.dlsite.com/' },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const work = data?.[sourceId] || data;

      return {
        sourceId,
        workId,
        title: work.work_name || work.title || sourceId,
        release: work.work_date || work.release || '',
        hasSubtitle: false,
        fileCount: 0,
        totalSize: 0,
        files: [],
        metadata: {
          circle: work.maker_name || work.circle_name || '',
          description: work.work_description || '',
          tags: (work.genres || []).map((g: any) => g.name || g),
          price: work.price || '',
          source: 'dlsite',
          sourceUrl: `https://www.dlsite.com/maniax/work/=/product_id/${sourceId}.html`,
        },
      };
    } catch {
      // Fallback: minimal result with known structure
      return {
        sourceId,
        workId,
        title: sourceId,
        release: '',
        hasSubtitle: false,
        fileCount: 0, totalSize: 0, files: [],
        metadata: { source: 'dlsite', sourceUrl: `https://www.dlsite.com/maniax/work/=/product_id/${sourceId}.html` },
      };
    }
  }

  async download(_input: string, _targetDir: string, _hooks?: ProgressHooks): Promise<DownloadSummary> {
    return { total: 0, done: 0, failed: 0, skipped: 0, bytesDownloaded: 0, files: [], errors: ['DLsite 下载尚未支持'] };
  }
}
