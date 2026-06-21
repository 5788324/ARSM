/**
 * Acquisition provider interface and shared types.
 *
 * All acquisition providers (asmr.one, etc.) implement this interface.
 * The runner orchestrates inspect → download → import via these types.
 */

// ─── Provider interface ─────────────────────────────────

export interface InspectResult {
  sourceId: string;
  workId: string;
  title: string;
  release: string;
  hasSubtitle: boolean;
  fileCount: number;
  totalSize: number;
  /** Per-file download info */
  files: InspectFile[];
  /** Provider-specific metadata (circle, tags, etc.) */
  metadata?: Record<string, unknown>;
}

export interface InspectFile {
  path: string;
  type: string;
  size: number;
  /** URL for downloading this file */
  downloadUrl: string;
  /** URL for streaming this file */
  streamUrl?: string;
}

export interface DownloadProgress {
  path: string;
  size: number;
  downloaded: number;
  status: 'pending' | 'downloading' | 'done' | 'failed' | 'skipped';
  error?: string;
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

/** Hooks for progress reporting during download */
export interface ProgressHooks {
  onFileStart?: (path: string) => void;
  onFileProgress?: (path: string, downloaded: number, total: number) => void;
  onFileDone?: (path: string) => void;
  onFileError?: (path: string, error: string) => void;
}

export interface AcquisitionProvider {
  /** Unique provider ID (e.g., "asmrone") */
  readonly id: string;
  /** Human-readable display name */
  readonly displayName: string;
  /** Whether this provider supports file download (default true) */
  readonly canDownload?: boolean;
  /** Check if this provider can handle the given input */
  supports(input: string): boolean;
  /** Inspect a work — return file tree without downloading */
  inspect(input: string): Promise<InspectResult>;
  /** Download all files for a work */
  download(input: string, targetDir: string, hooks?: ProgressHooks): Promise<DownloadSummary>;
}

// ─── Job types ──────────────────────────────────────────

/** Acquisition job status */
export type JobStatus =
  | 'pending'
  | 'inspecting'
  | 'downloading'
  | 'importing'
  | 'postprocessing'
  | 'done'
  | 'review'
  | 'done_with_errors'
  | 'failed'
  | 'cancelled';

/** Current step within a job */
export type JobStep =
  | 'inspect'
  | 'download'
  | 'import'
  | 'postprocess';

/** Progress snapshot stored during job execution */
export interface JobProgress {
  inspect?: { fileCount: number; totalSize: number };
  download?: { totalFiles: number; doneFiles: number; failedFiles: number; bytesDownloaded: number };
  import?: { foundWorks: number; foundTracks: number; errors: string[] };
  postprocess?: { status: string };
}

/** Full job record shape */
export interface AcquisitionJob {
  id: string;
  providerId: string;
  input: string;
  normalizedSourceId: string;
  targetDir: string;
  status: JobStatus;
  currentStep: JobStep | null;
  progressJson: string | null;
  resultJson: string | null;
  errorJson: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}

// ─── Step results ───────────────────────────────────────

export interface StepResult {
  ok: boolean;
  warnings: string[];
  errors: string[];
  stats: Record<string, unknown>;
}

// ─── Postprocess (future) ───────────────────────────────

export type PostprocessType =
  | 'extract_text'
  | 'extract_subtitle'
  | 'transcribe_audio'
  | 'translate_text'
  | 'build_search_index';

export interface PostprocessRequest {
  types: PostprocessType[];
  options?: Record<string, unknown>;
}
