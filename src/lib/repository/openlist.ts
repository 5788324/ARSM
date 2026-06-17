import {
  RepositoryAdapter,
  FileEntry,
  FileMetadata,
} from './types';

interface OpenListConfig {
  baseUrl: string;
  token?: string;
  mountPath?: string;
}

type RemoteRepoType = 'openlist' | 'webdav';

/**
 * OpenListAdapter — reads files from an OpenList server via HTTP API.
 *
 * OpenList is a storage aggregator that exposes files across local/cloud
 * providers through a unified REST/WebDAV interface.
 */
export class OpenListAdapter implements RepositoryAdapter {
  readonly name: string;
  readonly type: RemoteRepoType;
  private config: OpenListConfig;

  constructor(name: string, config: OpenListConfig, type: RemoteRepoType = 'openlist') {
    this.name = name;
    this.type = type;
    this.config = config;
  }

  private normalizeUrl(path: string): string {
    const base = this.config.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }

  private async fetch(path: string, init?: RequestInit): Promise<Response> {
    const url = this.normalizeUrl(path);
    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string>),
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    const res = await fetch(url, {
      ...init,
      headers,
    });

    if (!res.ok) {
      throw new Error(`Remote request failed: ${res.status} ${res.statusText} for ${url}`);
    }

    return res;
  }

  async listFiles(subPath: string): Promise<FileEntry[]> {
    const entries: FileEntry[] = [];

    try {
      const res = await this.fetch(`/api/files?path=${encodeURIComponent(subPath)}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        for (const item of data) {
          entries.push({
            relativePath: item.path || item.name || '',
            name: item.name || item.path?.split('/').pop() || '',
            size: item.size || 0,
            isDirectory: item.type === 'directory' || item.isDirectory === true,
            modifiedAt: item.modifiedAt ? new Date(item.modifiedAt) : undefined,
          });
        }
      }
    } catch {
      return this.listViaWebDAV(subPath);
    }

    return entries;
  }

  async listViaWebDAV(subPath: string): Promise<FileEntry[]> {
    const entries: FileEntry[] = [];

    try {
      const res = await this.fetch(`/${subPath}`, {
        method: 'PROPFIND',
        headers: {
          Depth: '1',
          'Content-Type': 'application/xml',
        },
      });

      const text = await res.text();

      const responseRegex = /<D:response>([\s\S]*?)<\/D:response>/g;
      let match;

      while ((match = responseRegex.exec(text)) !== null) {
        const block = match[1];

        const hrefMatch = block.match(/<D:href>([^<]+)<\/D:href>/);
        const displayNameMatch = block.match(/<D:displayname>([^<]+)<\/D:displayname>/);
        const contentLengthMatch = block.match(
          /<D:getcontentlength>(\d+)<\/D:getcontentlength>/,
        );
        const lastModifiedMatch = block.match(
          /<D:getlastmodified>([^<]+)<\/D:getlastmodified>/,
        );
        const isCollection = block.includes('<D:collection');

        const name = displayNameMatch
          ? displayNameMatch[1]
          : hrefMatch?.[1]?.split('/').filter(Boolean).pop() || '';

        if (hrefMatch && hrefMatch[1] === `/${subPath}`) continue;
        if (!name) continue;

        entries.push({
          relativePath: hrefMatch ? hrefMatch[1].replace(/^\/+/, '') : name,
          name,
          size: contentLengthMatch ? parseInt(contentLengthMatch[1], 10) : 0,
          isDirectory: isCollection,
          modifiedAt: lastModifiedMatch ? new Date(lastModifiedMatch[1]) : undefined,
        });
      }
    } catch {
      // Return empty if all methods fail
    }

    return entries;
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const res = await this.fetch(`/${filePath}`, { method: 'HEAD' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async resolvePath(filePath: string): Promise<string> {
    return this.normalizeUrl(filePath);
  }

  async getMetadata(filePath: string): Promise<FileMetadata> {
    try {
      const res = await this.fetch(`/${filePath}`, { method: 'HEAD' });

      const size = parseInt(res.headers.get('Content-Length') || '0', 10);
      const mimeType = res.headers.get('Content-Type') || 'application/octet-stream';
      const lastModified = res.headers.get('Last-Modified');

      return {
        relativePath: filePath,
        size,
        mimeType,
        modifiedAt: lastModified ? new Date(lastModified) : undefined,
      };
    } catch {
      return {
        relativePath: filePath,
        size: 0,
        mimeType: 'application/octet-stream',
      };
    }
  }

  async readBuffer(filePath: string): Promise<Buffer> {
    const res = await this.fetch(`/${filePath}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

/**
 * WebDAVAdapter — reads files from any WebDAV-compatible server.
 */
export class WebDAVAdapter extends OpenListAdapter {
  constructor(name: string, baseUrl: string, token?: string) {
    super(name, { baseUrl, token }, 'webdav');
  }
}
