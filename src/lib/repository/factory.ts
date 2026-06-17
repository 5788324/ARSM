import { RepositoryAdapter } from './types';
import { LocalAdapter } from './local';
import { OpenListAdapter, WebDAVAdapter } from './openlist';

export interface AdapterFactoryConfig {
  name: string;
  type: 'local' | 'openlist' | 'webdav';
  rootPath: string;
  config?: string; // JSON string with extra config
}

/**
 * Create a RepositoryAdapter from a storage repository record.
 */
export function createAdapter(config: AdapterFactoryConfig): RepositoryAdapter {
  const extraConfig = config.config ? JSON.parse(config.config) : {};

  switch (config.type) {
    case 'local':
      return new LocalAdapter(config.name, config.rootPath);

    case 'openlist':
      return new OpenListAdapter(config.name, {
        baseUrl: config.rootPath,
        token: extraConfig.token,
        mountPath: extraConfig.mountPath,
      });

    case 'webdav':
      return new WebDAVAdapter(
        config.name,
        config.rootPath,
        extraConfig.token,
      );

    default:
      throw new Error(`Unknown repository type: ${config.type}`);
  }
}
