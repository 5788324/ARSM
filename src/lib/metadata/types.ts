/**
 * MetadataProvider — fetches work metadata from external sources.
 *
 * Each provider handles a specific source (dlsite, asmr.one, etc.)
 * and normalizes the result into the internal WorkMetadata format.
 */

export interface WorkMetadata {
  displayTitle: string;
  originalTitle?: string;
  workCode?: string;
  circleName?: string;
  description?: string;
  coverUrl?: string;
  releaseDate?: string;
  tags: string[];
  voiceActors: string[];
  tracks: TrackMetadata[];
  sourceSite: string;
  sourceUrl: string;
}

export interface TrackMetadata {
  trackNumber: number;
  title: string;
  durationSec?: number;
}

export interface MetadataProvider {
  /** Provider identifier */
  readonly name: string;
  /** Supported query types */
  readonly supportedQueries: ('url' | 'code' | 'title')[];

  /** Fetch metadata by URL (e.g., product page) */
  fetchByUrl(url: string): Promise<WorkMetadata>;

  /** Fetch metadata by work code (e.g., RJ123456) */
  fetchByCode(code: string): Promise<WorkMetadata>;

  /** Search by title and return best match */
  fetchByTitle(title: string): Promise<WorkMetadata>;
}

export interface MetadataFetchResult {
  provider: string;
  queryType: 'url' | 'code' | 'title';
  queryValue: string;
  metadata: WorkMetadata | null;
  error?: string;
}
