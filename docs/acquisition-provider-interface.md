# Acquisition Provider Interface

## How to add a new provider

### 1. Implement `AcquisitionProvider`

```ts
// src/lib/acquisition/providers/mysource.ts

import { AcquisitionProvider, InspectResult, DownloadSummary, ProgressHooks } from '../types';

export class MySourceProvider implements AcquisitionProvider {
  readonly id = 'mysource';
  readonly displayName = 'My Source';

  supports(input: string): boolean {
    // Return true if this provider can handle the input
    return input.startsWith('MY-');
  }

  async inspect(input: string): Promise<InspectResult> {
    // Fetch work metadata and file tree from the external source
    // Return file list WITHOUT downloading
  }

  async download(input: string, targetDir: string, hooks?: ProgressHooks): Promise<DownloadSummary> {
    // Download all files to targetDir
    // Report progress via hooks
    // Return summary with per-file status
  }
}
```

### 2. Register the provider

```ts
// src/lib/acquisition/registry.ts

import { MySourceProvider } from './providers/mysource';

registerProvider(new MySourceProvider());
```

That's it. No other files need changes.

## Required Fields

### `InspectResult`

| Field | Type | Description |
|-------|------|-------------|
| `sourceId` | string | Display ID (e.g., "RJ01538000") |
| `workId` | string | Numeric ID for API calls |
| `title` | string | Work title |
| `release` | string | Release date |
| `hasSubtitle` | boolean | Whether subtitles exist |
| `fileCount` | number | Total files |
| `totalSize` | number | Total bytes |
| `files` | InspectFile[] | Per-file details |

### `InspectFile`

| Field | Type | Description |
|-------|------|-------------|
| `path` | string | Relative path within work |
| `type` | string | "audio", "image", "text", etc. |
| `size` | number | File size in bytes |
| `downloadUrl` | string | URL for downloading |
| `streamUrl` | string | URL for streaming (optional) |

### `DownloadSummary`

| Field | Type | Description |
|-------|------|-------------|
| `total` | number | Total files |
| `done` | number | Successfully downloaded |
| `failed` | number | Failed downloads |
| `skipped` | number | Skipped (already exists) |
| `bytesDownloaded` | number | Total bytes written |
| `files` | DownloadProgress[] | Per-file status |
| `errors` | string[] | Error messages |

## Provider Registry

```ts
// Get a specific provider
import { getProvider } from '@/lib/acquisition/registry';
const provider = getProvider('asmrone');

// Find the first provider that supports an input
import { findProvider } from '@/lib/acquisition/registry';
const provider = findProvider('RJ01538000');

// List all registered providers
import { listProviders } from '@/lib/acquisition/registry';
const all = listProviders();
```

## Files to modify for a new provider

1. Create: `src/lib/acquisition/providers/<name>.ts` — provider implementation
2. Edit: `src/lib/acquisition/registry.ts` — add `registerProvider(new XxxProvider())`
3. Done. The admin page automatically picks up new providers via `GET /api/acquisition/providers`.
