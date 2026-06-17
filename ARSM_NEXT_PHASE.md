# ARSM Next Phase Roadmap

## 1. Current State

ARSM has reached a usable MVP beta state and is considered complete for its phase-1 goals:

- private web application
- local login
- local library import
- work list and work detail pages
- browser playback
- listening progress
- metadata fetch preview
- duplicate review and merge
- basic admin backend
- Chinese web UI verified in browser

This document defines what DeepSeek should build next if development continues.

The key principle for all future work:

- preserve ARSM as a **private media library**
- do not turn it into a public mirror or uncontrolled scraper
- keep storage abstraction clean so OpenList and local storage can coexist

## 2. Priority Recommendation

DeepSeek should not add random features. Continue in this order:

1. Real storage integration hardening
2. Metadata pipeline hardening
3. Import/review workflow hardening
4. Playback and UX enhancements
5. Optional acquisition helpers

## 3. Phase 2 - Storage and Repository Hardening

### Goal

Make ARSM work reliably with the user's real storage environment, especially OpenList-backed repositories and future cloud-backed libraries.

### Must-do items

- Validate OpenList repository access against the user's actual OpenList deployment
- Validate WebDAV repository behavior in real usage
- Confirm media streaming works for remote repositories end-to-end
- Confirm cover image loading works for remote repositories
- Add explicit repository capability matrix in code and docs

### Implementation details

- Treat repository support as capability-driven:
  - list
  - exists
  - metadata
  - stream
  - cover
- Add repository health diagnostics:
  - auth failure
  - path mapping failure
  - timeout
  - file not found
- Add repository test fixtures or mock adapters for automated tests
- Add repository-level path normalization rules

### Acceptance criteria

- ARSM can browse and play media from a real OpenList-backed library
- Repository failures surface as readable UI errors
- README clearly states which repository types are production-ready vs experimental

## 4. Phase 3 - Metadata Pipeline Hardening

### Goal

Move from generic HTML parsing to more predictable metadata handling.

### Must-do items

- Replace regex-heavy generic parsing with provider-specific parsing modules where useful
- Improve field extraction accuracy:
  - title
  - original title
  - work code
  - circle
  - release date
  - tags
  - CV / voice actors
  - track list
- Add field-level confidence or provider support notes
- Improve metadata apply workflow

### Recommended enhancements

- Add per-field apply controls in admin UI
- Add “overwrite empty only” vs “manual overwrite selected fields” option
- Add metadata diff preview before apply
- Add metadata source history per work

### Acceptance criteria

- Admin can fetch metadata, preview changes, and safely apply selected fields
- Provider support matrix is accurate and visible in docs
- Metadata failures do not silently corrupt existing work records

## 5. Phase 4 - Import and Review Workflow Hardening

### Goal

Make import and duplicate review robust for real long-term library management.

### Must-do items

- Promote review handling from “jobs page helper UI” into a dedicated review workflow
- Add explicit review actions:
  - merge into existing work
  - keep as new work
  - ignore candidate
  - mark resolved
- Persist review decision state
- Improve duplicate matching heuristics with real collection feedback

### Recommended enhancements

- Add review queue filters:
  - unresolved
  - merged
  - ignored
  - import source
- Add import dry-run mode
- Add track reassignment tools
- Add split-work tool for wrongly grouped imports

### Acceptance criteria

- Large imports can be reviewed incrementally
- Duplicate candidates do not disappear after refresh
- Admin can fully resolve import ambiguities without database edits

## 6. Phase 5 - Playback and Listening Experience

### Goal

Turn ARSM from “playable” into “pleasant to use every day”.

### Recommended features

- persistent mini-player
- queue / playlist
- next/previous track controls
- track completion handling
- stronger resume behavior
- continue listening shelf improvements
- waveform display
- playback speed control
- keyboard shortcuts on desktop
- better touch controls on mobile

### Acceptance criteria

- Playback stays stable during page navigation
- Mobile use feels intentional, not just responsive
- Daily listening requires fewer clicks

## 7. Phase 6 - Cover and Media Asset Handling

### Goal

Make visual media handling more reliable across local and remote repositories.

### Recommended features

- local cover cache
- normalized cover import path strategy
- remote cover proxying
- missing cover fallback image
- optional thumbnail generation

### Acceptance criteria

- Works display consistent covers regardless of repository type
- Missing or broken covers fail gracefully

## 8. Phase 7 - Optional Acquisition Helpers

### Goal

Support operator-triggered acquisition assistance without turning ARSM into a bulk crawler.

### Scope rules

- no uncontrolled site-wide crawling
- no public mirror behavior
- no hidden background mass downloads

### Acceptable future capabilities

- manual URL input
- manual work code input
- fetch metadata for selected work
- operator-triggered guided acquisition job
- import downloaded files into configured repository target

### New requirement: asmr.one targeted acquisition

The user wants future support for acquiring ARSM files from `asmr.one` in a controlled way.

This should be treated as a provider-specific acquisition module, not a generic crawler.

#### Required scope

- accept a single work URL such as `https://www.asmr.one/work/RJ...`
- resolve work metadata
- resolve track/media endpoints if accessible
- obtain any required token or signed media URL if the provider flow allows it
- download only the explicitly selected work
- write files into a configured repository target
- trigger ARSM import after successful download

#### Required constraints

- no whole-site crawling
- no background mass harvesting
- no mirror-all behavior
- keep the logic isolated in a dedicated provider module

#### Recommended implementation order

1. reverse-engineer the provider flow:
   - work API
   - tracks API
   - token acquisition
   - media stream/download endpoint
2. build a dry-run inspector that only prints discovered media structure
3. build actual download support only after the dry-run is reliable

#### Acceptance criteria

- admin can submit one `asmr.one` work URL
- system can determine whether downloadable media is actually accessible
- if accessible, the selected work is downloaded into the target repository
- if inaccessible, the UI shows the exact failing step clearly

### Not recommended

- full-site scrape jobs
- mass queue from search results without explicit confirmation

## 9. Phase 8 - Subtitle and Translation Pipeline

### Goal

Handle the common case where many ASMR works do not have usable Chinese subtitles.

This should be treated as a separate pipeline from metadata acquisition.

### Real-world subtitle cases to support

- no subtitle file at all
- subtitle file exists but is Japanese only
- subtitle exists as `.vtt`
- subtitle exists as `.srt`
- subtitle exists as `.txt`
- subtitle exists as PDF or image-like reading material

### Recommended strategy

Use a multi-stage translation pipeline, not a single naive translation call.

#### Stage 1: Subtitle discovery and ingestion

- detect sidecar subtitle files near audio
- support `vtt`, `srt`, `txt` first
- support PDF extraction later
- store original subtitle text separately from translated text

#### Stage 2: Normalization

- parse subtitle timestamps when available
- normalize plain text into paragraph or segment blocks
- extract text from PDF where possible
- mark extraction confidence and source type

#### Stage 3: Translation

- use an LLM translation pipeline for Japanese-to-Chinese translation
- preserve timestamps where present
- preserve speaker or track segmentation where possible
- cache translation results

#### Stage 4: Review and export

- preview original and translated text side by side
- allow manual correction
- export translated `vtt`, `srt`, or `txt`

### Important recommendation

Yes, a large-model translation pipeline is worth doing, but not as the first next feature.

The best order is:

1. subtitle ingestion and storage
2. subtitle preview UI
3. translation job queue
4. translation provider abstraction

### Translation architecture suggestion

- `SubtitleSource`
- `SubtitleSegment`
- `TranslationJob`
- `TranslationProvider`

This keeps the system flexible for later switching between hosted APIs and local models.

### Acceptance criteria

- admin can attach or import subtitle-like text for a work
- system can run a translation job and save translated results
- translated subtitles can be viewed alongside the work
- timestamped subtitles remain timestamped after translation

## 10. Phase 9 - App Form Factors

### Goal

Expand ARSM beyond the browser when the web version is already stable.

### Desktop app feasibility

Yes, feasible, and relatively low-friction later.

#### Recommended approach

- keep ARSM as a web-first app
- package it as a desktop shell only after the web version is stable
- preferred desktop path:
  - Tauri
  - Electron only if broader desktop integration is needed

#### Why not now

- desktop packaging does not solve the current product gaps
- it increases build, release, and update complexity

### Android app feasibility

Yes, but it is more work than desktop packaging.

#### Recommended approach

Option 1, preferred first:

- make ARSM a strong mobile web app or PWA
- support home-screen install
- optimize playback, resume, and touch UX

Option 2, later:

- build a dedicated Android wrapper or native app
- likely React Native, Flutter, or a WebView wrapper if requirements stay simple

#### Why not now

- native Android introduces auth, storage, background audio, notification controls, and release complexity
- the web app should prove the usage model first

### Recommended final sequence

1. stable web app
2. strong mobile web or PWA
3. desktop shell
4. native Android only if the web app is no longer enough

### Acceptance criteria

- desktop: packaged app can log in, browse, and play
- Android/PWA: mobile install and playback are stable
- no duplicate business logic should be created outside the main web app

## 11. Phase 10 - Nice-to-Have Features

These are useful, but not urgent:

- favorites collections
- custom playlists
- “recently imported” and “recently updated metadata” shelves
- PWA install polish
- batch tag tools
- advanced search operators
- multilingual title display preferences
- export/import metadata backups

## 12. Features That Should Wait

Do not prioritize these until the earlier phases are stable:

- public sharing
- social features
- comments/reviews
- multi-tenant accounts
- uncontrolled download automation

## 13. Recommended Tracking Structure

DeepSeek should continue work as separate issue-sized branches or milestones:

1. `phase2-storage-hardening`
2. `phase3-metadata-hardening`
3. `phase4-review-workflow`
4. `phase5-player-ux`
5. `phase6-cover-assets`
6. `phase7-acquisition-helpers`
7. `phase8-subtitle-translation`
8. `phase9-app-form-factors`

Each milestone should end with:

- updated README
- screenshots for affected UI
- short handoff summary
- explicit known limitations

## 14. Final Guidance for DeepSeek

DeepSeek should treat the project as:

- phase-1 complete
- phase-2 onward focused on reliability and quality

The next best investment is **real OpenList integration validation**, because that connects directly to the user's actual long-term usage model.
