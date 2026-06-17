/**
 * RepositoryAdapter — abstracts file access across storage backends.
 *
 * Implementations: LocalAdapter, OpenListAdapter, WebDAVAdapter
 */

export interface FileEntry {
  /** Relative path within the repository */
  relativePath: string;
  /** File name */
  name: string;
  /** File size in bytes */
  size: number;
  /** Whether this is a directory */
  isDirectory: boolean;
  /** Last modified timestamp */
  modifiedAt?: Date;
}

export interface FileMetadata {
  relativePath: string;
  size: number;
  mimeType: string;
  modifiedAt?: Date;
}

export interface RepositoryAdapter {
  /** Human-readable name for this repository */
  readonly name: string;
  /** Repository type identifier */
  readonly type: 'local' | 'openlist' | 'webdav';

  /** List all files under a logical path (recursive) */
  listFiles(rootPath: string): Promise<FileEntry[]>;

  /** Check if a file exists */
  exists(filePath: string): Promise<boolean>;

  /** Get the absolute filesystem path or stream URL for a file */
  resolvePath(filePath: string): Promise<string>;

  /** Get file metadata (size, mime type) */
  getMetadata(filePath: string): Promise<FileMetadata>;

  /** Read a file as a Buffer (for cover images, etc.) */
  readBuffer(filePath: string): Promise<Buffer>;
}

export interface RepositoryConfig {
  id?: string;
  name: string;
  type: 'local' | 'openlist' | 'webdav';
  rootPath: string;
  /** JSON extra config: auth tokens, mount options, etc. */
  extraConfig?: Record<string, unknown>;
}
