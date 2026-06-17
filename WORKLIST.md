# ARSM Detailed Worklist

## 1. Delivery Rules

- Implement in vertical slices.
- Keep the app runnable at all times.
- Do not couple work metadata to raw filesystem assumptions.
- Do not build uncontrolled site-wide crawling.
- Every milestone must end with a runnable demo and a short handoff note.

## 2. Phase 0 - Project Setup

### Objectives

- Create the project scaffold and choose final framework packages.
- Establish coding conventions, environment handling, and deployment assumptions.

### Tasks

- Initialize monorepo or single app structure.
- Add frontend app and backend capability.
- Add PostgreSQL setup and migration tooling.
- Add lint, typecheck, format, and test commands.
- Add `.env.example`.
- Add README with local run instructions.
- Add base Docker or local dev startup instructions if needed.

### Exit criteria

- Fresh clone can boot the app shell locally.
- Database can be created and migrated.
- CI-quality local commands exist for install, dev, build, and test.

## 3. Phase 1 - Core Schema and Auth

### Objectives

- Build the minimal secure foundation.

### Tasks

- Define database schema for users, works, tracks, tags, circles, repositories, jobs, history, and favorites.
- Implement local admin bootstrap flow.
- Implement login/logout/session handling.
- Add protected admin routes.
- Add seed script for first admin.

### Exit criteria

- Admin can log in.
- Admin-only routes are protected.
- Core schema can represent a work with multiple tracks and media file references.

## 4. Phase 2 - Local Repository and Import Scanner

### Objectives

- Make local owned content importable and browsable.

### Tasks

- Define `RepositoryAdapter` interface.
- Implement local filesystem repository adapter.
- Define library root configuration.
- Build recursive import scanner for supported audio and image formats.
- Extract file metadata using ffprobe.
- Group tracks into works using folder structure heuristics.
- Create import job records and status reporting.
- Add duplicate detection heuristics.
- Add manual review state for low-confidence matches.

### Supported file assumptions

- Audio: mp3, m4a, flac, wav, ogg if practical
- Image: jpg, jpeg, png, webp

### Exit criteria

- Admin can point the system at a local folder.
- Import job creates works and tracks visible in database and UI.
- Failed files are logged with actionable reason.

## 5. Phase 3 - Library UI and Playback

### Objectives

- Deliver the first real user experience.

### Tasks

- Build login page.
- Build works grid/list page.
- Build work detail page with cover, metadata, and track list.
- Build audio player component.
- Build continue listening view.
- Build search input and filter sidebar.
- Add pagination or infinite scroll.
- Add mobile-responsive layout.

### Playback tasks

- Implement track stream endpoint.
- Support seek and resume.
- Persist listening progress.
- Persist last played track per work.

### Exit criteria

- User can browse imported works.
- User can play tracks in browser on desktop and mobile.
- Resume progress works after refresh.

## 6. Phase 4 - Metadata Provider Pipeline

### Objectives

- Allow operator-triggered metadata enrichment for specific works.

### Tasks

- Define `MetadataProvider` interface.
- Build manual metadata fetch form for URL, code, or keyword.
- Create metadata job table and execution flow.
- Parse and normalize incoming metadata into internal schema.
- Store source provider, source URL, and fetched timestamp.
- Build preview-before-apply UI for metadata changes.
- Allow merge into existing work or create new work.

### Safety rules

- Only fetch one specified work or one explicit query result set at a time.
- Do not run unrestricted background crawling.
- Keep provider-specific code isolated from core library logic.

### Exit criteria

- Admin can fetch metadata for a chosen work.
- Admin can preview and apply or reject metadata changes.
- Source provenance is preserved.

## 7. Phase 5 - Admin Operations

### Objectives

- Make the system maintainable without direct database edits.

### Tasks

- Dashboard for import and metadata jobs.
- Duplicate review page.
- Broken file audit page.
- Work merge/split controls.
- Track reorder and rename controls.
- Tag cleanup tools.
- Re-scan single work action.

### Exit criteria

- Admin can fix common data quality issues in UI.
- Long-running jobs are visible and recoverable.

## 8. Phase 6 - Repository Abstraction Expansion

### Objectives

- Prepare for cloud-backed media without rewriting the core app.

### Tasks

- Finalize repository adapter contract.
- Add repository management UI.
- Support multiple repository records.
- Add health-check and file existence checks per repository.
- Add path mapping rules between logical library paths and repository paths.

### OpenList-specific tasks

- Implement OpenList repository adapter.
- Support configured base URL, auth credentials if needed, and mount path mapping.
- Read media and covers from OpenList-backed storage.
- Keep OpenList integration read-first before considering write support.

### Exit criteria

- App can read media from at least one non-local repository implementation.
- Switching a work's file source does not require rewriting domain schema.

## 9. Phase 7 - Favorites, History, and Personal UX

### Objectives

- Improve the private daily-use experience.

### Tasks

- Favorites toggle and favorites page.
- Listening history page.
- Continue listening shelf on home page.
- Recent imports shelf.
- Recently updated metadata shelf.

### Exit criteria

- Private user can treat the app as a personal listening hub, not just a file browser.

## 10. Phase 8 - Mobile and Polish

### Objectives

- Make the product feel finished.

### Tasks

- Improve touch interactions.
- Verify responsive layouts for phone and tablet widths.
- Improve player persistence during navigation.
- Add empty states and failure states.
- Improve loading states.
- Add keyboard-friendly desktop interactions where useful.

### Exit criteria

- App is pleasant on phone and desktop.
- Common failure states are understandable.

## 11. Phase 9 - Optional Download/Acquisition Workflow

### Objectives

- Only after the private library foundation is solid, add operator-triggered acquisition helpers.

### Tasks

- Design explicit acquisition job model.
- Accept manual work URL or code as input.
- Add provider-specific fetch/download workflow behind admin-only actions.
- Save downloaded media into configured repository target.
- Link downloaded files back to work records.

### Hard constraints

- No uncontrolled global crawler.
- No "mirror whole site" feature.
- No mixing provider credentials directly into unrelated modules.

### Exit criteria

- Admin can trigger a targeted acquisition flow for a specific selected work.

## 12. Required Interfaces

### RepositoryAdapter

Responsibilities:

- list files under a logical path
- check existence
- read stream URL or stream handle
- resolve cover/image access
- return normalized file metadata

### MetadataProvider

Responsibilities:

- fetch metadata by explicit URL/code/query
- normalize provider fields
- return preview payload
- report provider-specific errors clearly

### ImportScanner

Responsibilities:

- scan a repository subtree
- identify candidate works/tracks
- emit import job results
- emit ambiguity flags for review

## 13. Test Checklist

### Unit tests

- path normalization
- folder-to-work grouping heuristics
- duplicate detection heuristics
- metadata normalization
- listening progress persistence

### Integration tests

- login and protected routes
- import local folder end-to-end
- playback endpoint for a valid audio file
- metadata fetch job creation and apply flow
- repository adapter contract compliance

### Manual QA

- desktop browse and playback
- mobile browse and playback
- duplicate review workflow
- broken file handling
- long titles and multilingual metadata

## 14. Priority Order for DeepSeek

DeepSeek should execute tasks in this exact order:

1. Project scaffold
2. Core schema and auth
3. Local repository adapter
4. Local import scanner
5. Works UI
6. Work detail and playback
7. Search and filters
8. Metadata provider abstraction
9. Manual metadata fetch flow
10. Admin operations
11. OpenList adapter
12. Personal UX polish
13. Optional targeted acquisition workflow

## 15. Deliverables Expected Per Milestone

For every milestone, DeepSeek should produce:

- runnable code
- updated README instructions
- concise handoff note
- known issues list
- next-step recommendation

## 16. Review Focus for Final Merge

When Codex reviews the DeepSeek implementation, focus on:

- domain model quality
- repository/storage abstraction quality
- whether OpenList integration is decoupled cleanly
- whether provider-specific acquisition logic is isolated
- mobile playback UX
- whether the system stayed private-first instead of turning into a generic scraper
