# Acquisition Admin Workflow

## Page: `/admin/acquisition`

### Create Job

1. Select provider (asmr.one by default)
2. Enter RJ code or URL (e.g., `RJ01538000`)
3. Set target download directory
4. Toggle "自动导入" (auto-import after download)
5. Click "开始采集"

The job is created immediately. The browser shows the job list and auto-refreshes every 3 seconds while jobs are running.

### Job Lifecycle & Statuses

| Status | Meaning | Next |
|--------|---------|------|
| `pending` | Job created, waiting to start | → `inspecting` |
| `inspecting` | Fetching work metadata and file tree | → `downloading` or `done` (if autoImport=false) |
| `downloading` | Downloading files from provider | → `importing` |
| `importing` | Running import (scan + duplicate detect + create) | → final status |
| `postprocessing` | Reserved for future subtitle/translation | → final status |
| `done` | Complete success | — |
| `review` | Duplicate candidates found — admin review needed | — |
| `done_with_errors` | Completed but some files/downloads/imports failed | — |
| `failed` | Fatal error during execution | — |

### Job Detail View

Click any job in the list to open a detail modal showing:

- **Inspector result**: file count, total size
- **Download result**: done/failed counts, bytes downloaded
- **Import result**: works created, tracks imported, review count
- **Error details**: expandable JSON with per-step error lists

### Handling Issues

| Scenario | Action |
|----------|--------|
| Download has failures | Check error details → re-run job |
| Import enters `review` | Go to `/admin/duplicates` to merge works |
| Import enters `done_with_errors` | Check error details → fix issue → re-import via `/api/import` |

### Backward Compat

The old `/api/acquisition/asmrone` route still works:
- `action=inspect` → returns file tree (no download triggered)
- `action=download` → creates a job via the unified API

New integrations should use `POST /api/acquisition/jobs` directly.
