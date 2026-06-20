/**
 * DLsiteProvider — stub for future dlsite.com integration.
 *
 * Not yet functional. Reserved structure for Phase 8+.
 */
import { AcquisitionProvider, InspectResult, DownloadSummary, ProgressHooks } from '../types';

export class DLsiteProvider implements AcquisitionProvider {
  readonly id = 'dlsite';
  readonly displayName = 'DLsite (未接入)';

  supports(input: string): boolean {
    // DLsite format: RJ123456 or 8-digit work ID
    return /^RJ\d{6,}$/i.test(input.trim());
  }

  async inspect(input: string): Promise<InspectResult> {
    throw new Error('DLsite provider not yet implemented. Reserved for future phases.');
  }

  async download(input: string, targetDir: string, hooks?: ProgressHooks): Promise<DownloadSummary> {
    throw new Error('DLsite provider not yet implemented. Reserved for future phases.');
  }
}
