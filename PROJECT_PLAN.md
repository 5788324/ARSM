# ARSM Project Plan

## 1. Project Summary

ARSM is a private web-based ASMR/audio library for a single owner or a very small trusted household audience. It should provide a Kikoeru/asmr.one-style browsing and playback experience while keeping the system private, storage-agnostic, and maintainable.

The product is not a public mirror site. It is a private media library that:

- imports local files already owned by the user
- supports manual or semi-automatic metadata import for specific works
- can later use OpenList and cloud drives as storage backends
- exposes a polished web UI for browsing, search, and playback

Primary principle: the system centers on the user's owned/private collection, not unrestricted third-party scraping.

## 2. Product Goals

### Core goals

- Build a private web application that feels similar to Kikoeru/asmr.one for end-user browsing.
- Support local media import first, then remote repository integration.
- Allow the user to manually specify a work URL, work code, or keyword and let the system fetch metadata and optionally download assets/media for that specific work.
- Maintain a clean data model so metadata, media files, and storage locations are decoupled.
- Make the first version usable on desktop and mobile browsers.

### Non-goals for v1

- Public sharing community features
- Multi-tenant SaaS
- Full-site mirroring of third-party catalog sites
- Large-scale crawler orchestration
- DRM circumvention

## 3. Users and Usage Model

### Primary user

- Single owner/operator
- Uses Windows desktop
- Prefers private storage and private browsing
- Has local disks, OpenList, and various cloud drives available

### Secondary users

- Optional small household/trusted users later
- Read-only browsing and playback only

### Main usage flows

1. Import owned local audio folders into the library.
2. Add metadata for a work via manual input such as RJ code, title, or work page URL.
3. Browse works by circle, tag, voice actor, language, or favorites.
4. Play tracks in browser, resume progress, and continue across devices.
5. Later connect storage repositories such as OpenList-backed folders or cloud drives.

## 4. Recommended Architecture

### Recommended stack

- Frontend: Next.js
- Backend API: Next.js server routes or NestJS
- Database: PostgreSQL
- Search: PostgreSQL full-text for v1
- Cache/queue: Redis optional in v2, not required for MVP
- Media processing: ffmpeg and ffprobe
- Background jobs: simple database-backed job queue in MVP, dedicated queue later
- Storage abstraction: local filesystem first, pluggable repository layer for OpenList/WebDAV/cloud later

### Why this stack

- Strong web UX support
- Easy mobile-friendly UI delivery
- Good ecosystem for auth, media metadata, and admin tooling
- Avoids over-engineering for MVP

## 5. System Boundaries

### Separate responsibilities

ARSM should not become a generic file indexer like OpenList.

OpenList role:

- optional underlying storage gateway
- repository aggregation across local/cloud providers
- file access source only

ARSM role:

- domain-specific media library
- work metadata model
- browse/search/filter UI
- playback UX
- import workflows
- listening history and favorites

## 6. Functional Scope

### MVP scope

#### Authentication

- Local admin account
- Optional simple password auth for private use
- Session-based auth

#### Library domain

- Works
- Tracks
- Circles
- Voice actors
- Tags
- Cover images
- Alternate titles
- Source references

#### Import

- Scan local folder recursively
- Detect audio files and sidecar images
- Create work and track records
- Allow manual merge/split correction from admin UI

#### Metadata acquisition

- Manual input by URL, RJ code, or title
- Fetch work metadata for one selected work at a time
- Parse title, cover, tags, circle, track list, release info, and description
- Store source URL and fetch timestamp

#### Playback

- Browser playback for common formats
- Track queue
- Resume progress
- Mark played / partially played

#### Browse/search

- Home page
- Works list
- Work detail page
- Search by title/code
- Filter by circle/tag/voice actor
- Sort by added time, updated time, release time

#### Admin

- Import jobs page
- Metadata repair tools
- Duplicate detection view
- File link/availability checker

### Post-MVP scope

- OpenList repository sync
- Remote repository browser
- Multi-storage redundancy
- Favorites collections and playlists
- Batch metadata fixing
- Multiple user profiles
- Waveform preview
- Transcoding/cache generation
- Mobile app or PWA packaging

## 7. Data Model

### Core entities

- `users`
- `works`
- `work_sources`
- `tracks`
- `circles`
- `voice_actors`
- `tags`
- `work_tags`
- `work_voice_actors`
- `track_files`
- `storage_repositories`
- `listening_history`
- `favorites`
- `import_jobs`
- `metadata_jobs`

### Required work fields

- internal id
- display title
- original title
- work code such as RJ-style code when available
- circle name
- description
- cover path
- release date
- duration summary
- source site name
- source URL
- created_at
- updated_at

### Required track fields

- work_id
- track number
- title
- duration
- storage file reference
- mime type
- bitrate if available
- checksum if available

### Storage repository abstraction

Each media file should point to a logical repository record instead of hardcoding a raw disk path into the work model.

Repository types for roadmap:

- local
- openlist
- webdav
- direct cloud provider

## 8. Storage Strategy

### Phase 1

- Import from local folders on disk
- Save canonical absolute path or relative path under a configured library root
- Generate normalized media references in database

### Phase 2

- Add repository abstraction layer
- Read remote repositories through adapters
- Prefer read-only remote integration first

### OpenList integration direction

ARSM should treat OpenList as an optional repository adapter, not as the primary domain backend.

Expected future behavior:

- define one or more OpenList repositories
- map mount paths to logical library roots
- read files and metadata through HTTP/WebDAV/API
- keep ARSM's media index separate from OpenList's directory view

## 9. Metadata and Import Strategy

### Import modes

1. Local folder import
2. Manual metadata fetch by work URL
3. Manual metadata fetch by work code
4. Manual metadata fetch by title keyword

### Rules

- No unrestricted whole-site crawling in MVP
- Metadata fetch should be explicit and operator-triggered
- Download tasks should be explicit and operator-triggered
- Every imported source should store provenance

### Matching strategy

- Match existing work by work code first
- Fallback to normalized title + circle
- If confidence is low, place in review queue

## 10. UI Requirements

### User-facing pages

- login
- home / latest works
- works index
- work detail page
- search results
- favorites
- continue listening

### Admin pages

- dashboard
- import local folder
- metadata fetch
- repositories
- job status
- duplicate review
- broken file audit

### UX quality bar

- Mobile-friendly layout
- Strong cover-based visual browsing
- Fast search feedback
- Clear distinction between works and tracks
- Audio player persistent across page navigation if feasible

## 11. API and Internal Interfaces

### Public app API areas

- auth
- works query
- work detail
- track streaming
- search
- favorites/history
- import jobs
- metadata jobs
- repository configuration

### Required internal modules

- auth module
- library module
- playback module
- importer module
- metadata provider module
- repository adapter module
- admin module

### Adapter interfaces to define early

- `RepositoryAdapter`
- `MetadataProvider`
- `ImportScanner`

These interfaces must be stable before broad feature work starts.

## 12. Security and Privacy

- Default private deployment
- No anonymous access by default
- Configurable admin password or local auth
- Store secrets in env/config, never in frontend
- Protect repository credentials
- Log metadata job failures without exposing tokens

## 13. Delivery Phases

### Phase A: Foundation

- project scaffold
- database schema
- auth
- local repository config
- local import

### Phase B: Core library

- works/tracks browse
- work detail page
- playback
- search and filters

### Phase C: Metadata workflows

- manual fetch by URL/code/title
- source provenance
- duplicate review

### Phase D: Repository expansion

- repository abstraction
- OpenList integration
- remote file audit

### Phase E: Polish

- favorites/history
- mobile UX
- error handling
- admin quality of life

## 14. Acceptance Criteria for MVP

- Admin can create and log into the system.
- Admin can configure at least one local library root.
- Admin can import a local folder containing multiple works and tracks.
- The UI shows works with cover, title, tags, and track counts.
- A work detail page can play tracks in browser.
- The system stores and resumes listening progress.
- Admin can manually fetch metadata for a selected work by URL or code.
- Duplicate or ambiguous imports appear in an admin review queue instead of silently merging wrong data.
- The app works on desktop and mobile browser.

## 15. Handoff Expectations for DeepSeek

DeepSeek should not start by scraping or building download automation first. The correct implementation order is:

1. foundation and schema
2. local import and playback
3. library UI
4. metadata provider pipeline
5. repository adapters

DeepSeek should keep architecture simple, avoid premature microservices, and preserve the repository adapter boundary so OpenList integration can be added cleanly later.
