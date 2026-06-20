# Acquisition Architecture

## Overview

ARSM's acquisition system downloads works from external sources (asmr.one, etc.)
and imports them into the library via a unified async job pipeline.

## Architecture Diagram

```
┌─────────────────────┐
│  /admin/acquisition │  Admin UI (job creation + list)
└────────┬────────────┘
         │ POST /api/acquisition/jobs
         ▼
┌─────────────────────┐
│  createAcquisitionJob│  Creates AcquisitionJob record
└────────┬────────────┘
         │ fire-and-forget
         ▼
┌─────────────────────┐
│  runAcquisitionJob  │  Async runner
│                     │
│  Step 1: inspect    │  provider.inspect(input) → file tree
│  Step 2: download   │  provider.download(input, dir) → local files
│  Step 3: import     │  runImport({rootPath}) → works/tracks in DB
│  Step 4: postprocess│  stub — reserved for subtitle/translation
└────────┬────────────┘
         │ update AcquisitionJob
         ▼
┌─────────────────────┐
│  AcquisitionJob     │  status, progressJson, resultJson, errorJson
└─────────────────────┘
```

## Components

### Provider Layer (`src/lib/acquisition/`)

| File | Role |
|------|------|
| `types.ts` | `AcquisitionProvider` interface, job types, step results |
| `registry.ts` | Provider registry — register/get/list/find |
| `runner.ts` | Async job orchestrator — creates jobs, runs pipeline |
| `providers/asmrone.ts` | asmr.one provider implementation |
| `asmrone.ts` | Backward-compatible re-exports |

### Import Layer (`src/lib/import/`)

| File | Role |
|------|------|
| `service.ts` | Shared `runImport()` — scan → duplicate detect → create works/tracks |

### API Layer (`src/app/api/`)

| Route | Purpose |
|-------|---------|
| `POST /api/acquisition/jobs` | Create acquisition job (returns immediately) |
| `GET /api/acquisition/jobs` | List jobs or get by `?id=` |
| `GET /api/acquisition/providers` | List available providers |
| `POST /api/acquisition/asmrone` | ⚠ Compat route — delegates to unified API |
| `POST /api/import` | Direct import (shared with runner) |

### Admin UI (`src/app/admin/`)

| Page | Purpose |
|------|---------|
| `/admin/acquisition` | Create jobs, view job list, inspect job details |

## Data Flow

1. Admin fills form → `POST /api/acquisition/jobs` with `{providerId, input, targetDir, autoImport}`
2. `createAcquisitionJob()` creates `AcquisitionJob` record (status: `pending`)
3. `runAcquisitionJob()` starts async:
   - Resolves provider via registry
   - `inspect()` → stores `progressJson.inspect`
   - `download()` → stores `progressJson.download`
   - `runImport()` → stores `progressJson.import`
   - Determines final status: `done` / `review` / `done_with_errors` / `failed`
4. Admin page polls `GET /api/acquisition/jobs` every 3 seconds
5. Click any job → modal with structured progress/result/error details

## Backward Compatibility

`/api/acquisition/asmrone` is kept for existing callers:
- `action=inspect` → direct `provider.inspect()` (no job created)
- `action=download` → creates job via unified API

New code should use `/api/acquisition/jobs` directly.

## Postprocess Pipeline (Future)

Reserved step types in `PostprocessType`:
- `extract_text` — extract subtitle/text from downloaded files
- `extract_subtitle` — parse VTT/SRT/PDF subtitles
- `transcribe_audio` — ASR (Whisper, etc.)
- `translate_text` — LLM translation
- `build_search_index` — full-text search index
