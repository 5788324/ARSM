# ARSM Review Fix List

## Purpose

This document captures the second-round repair scope after review of the current ARSM implementation in `G:\Hermes Agent\ARSM\ARSM`.

It is intended for the implementation agent to fix blocking issues, align claims with actual behavior, and close the most important feature gaps before the project is considered merge-ready.

This is not a broad rewrite request. It is a targeted stabilization and truth-alignment pass.

## Current Overall Assessment

The current implementation is a usable first pass, but it is **not yet consistent with its own acceptance claims**.

Main problems:

- some features are claimed complete but are not actually implemented
- some high-risk runtime paths are implemented in a way that will not scale or remain stable
- some repository/storage abstractions exist in name but are not validated against real OpenList behavior
- documentation overstates completed functionality

The project should be treated as **MVP beta**, not final MVP complete.

## Priority Order

The implementation agent should work in this exact order:

1. Fix false-complete / blocking behavior mismatches
2. Fix runtime architecture issues in streaming and import
3. Validate or reduce unsupported repository claims
4. Close missing MVP behaviors
5. Update documentation and acceptance checklist to match reality

## Section A - Blocking Fixes

### A1. Metadata title search is exposed but not implemented

#### Problem

- UI allows `title` query mode.
- API accepts `queryType=title`.
- Provider implementation throws for title search.
- README claims title search works.

#### Required fix

Choose one of these two options and implement consistently:

Option 1, preferred:

- implement real title-query support for supported metadata providers
- make provider capability explicit
- only show title mode in UI if the selected provider supports it

Option 2, fallback:

- remove title search from UI
- reject title search at API validation level with a clear message
- remove title-search claims from README and acceptance notes

#### Files likely involved

- `src/lib/metadata/provider.ts`
- `src/app/api/metadata/fetch/route.ts`
- `src/app/admin/metadata/page.tsx`
- `README.md`

#### Acceptance criteria

- no visible title-search option unless it works
- no runtime error path for a supported user action
- README matches actual support matrix

### A2. Duplicate import review queue is not implemented

#### Problem

- Import always creates new works.
- No import-time duplicate detection gate exists.
- Job status never enters `review`.
- Current duplicates page is post-hoc reporting only.
- Acceptance claim says duplicates enter review queue, which is not true.

#### Required fix

Implement import-time duplicate handling:

- before creating a `work`, check likely duplicate candidates
- candidate matching order:
  - exact `workCode`
  - normalized title + same circle
  - strong title similarity threshold
- if confidence is high duplicate:
  - do not silently create a second work
  - create a review record or mark import job as `review`
- if confidence is uncertain:
  - queue for admin review before final commit

#### Recommended implementation shape

- introduce a dedicated duplicate review record/table, or
- extend `ImportJob` with structured review payload

Minimum acceptable behavior:

- import API returns `review` when duplicate candidates exist
- admin UI shows candidate matches with actions:
  - merge into existing
  - create anyway
  - ignore

#### Files likely involved

- `prisma/schema.prisma`
- `src/app/api/import/route.ts`
- `src/lib/scanner.ts`
- `src/app/admin/duplicates/page.tsx`
- possibly new admin API routes for review actions

#### Acceptance criteria

- import of duplicate-like content does not silently create duplicate works
- admin has an actionable review queue
- import job status can be `review`

### A3. Audio streaming is not truly streaming

#### Problem

- local playback loads entire file into memory via `readFileSync`
- range requests still read the whole file first
- remote playback buffers full remote response into memory
- this is not production-safe for large files

#### Required fix

Replace memory-buffer serving with true streaming:

- local files:
  - use `createReadStream`
  - support byte-range reads without loading full file
- remote files:
  - pipe upstream response stream through
  - preserve status, range headers, content length, content type

#### Additional requirements

- return correct `206` / `200`
- validate malformed ranges
- preserve seek behavior in browser player

#### Files likely involved

- `src/app/api/tracks/[trackId]/stream/route.ts`

#### Acceptance criteria

- no full-file memory buffering on local path
- no full-file memory buffering on remote path
- seek works in browser
- large audio files do not spike process memory linearly with file size

### A4. OpenList/WebDAV adapter is not credible as completed support

#### Problem

- adapter uses guessed `/api/files` behavior
- `mountPath` exists but is not applied
- path resolution is too naive
- README claims OpenList/WebDAV support more strongly than the code proves

#### Required fix

Decide one of these paths:

Option 1, preferred:

- test against a real running OpenList instance
- implement path mapping, authentication, and file existence checks against actual behavior
- clearly separate OpenList adapter vs generic WebDAV adapter

Option 2, fallback:

- downgrade claim from “supported” to “experimental”
- keep adapter behind explicit experimental label
- remove strong README wording

#### Required validation

Use the user's existing OpenList environment and verify:

- repository creation
- health check
- file listing
- metadata lookup
- playback path resolution
- at least one real audio file stream

#### Files likely involved

- `src/lib/repository/openlist.ts`
- `src/lib/repository/factory.ts`
- `src/app/api/repositories/route.ts`
- `README.md`

#### Acceptance criteria

- OpenList integration is either truly validated or explicitly marked experimental
- no unsupported production claim remains in docs

## Section B - Important Non-Blocking Fixes

### B1. README encoding and output quality

#### Problem

- README contains mojibake / broken encoding characters
- this lowers handoff quality and makes the repo look broken

#### Required fix

- normalize file encoding to UTF-8
- clean all corrupted glyphs
- verify rendered Markdown on GitHub and locally

### B2. Git repository state is missing locally

#### Problem

- current local folder is not a Git repository
- cannot confirm parity with `5788324/ARSM`

#### Required fix

- confirm whether work is already pushed to GitHub
- if local folder is intended to be the Git checkout, initialize or reclone correctly
- ensure final delivery is attached to the actual repo history

### B3. Import path behavior needs clearer validation

#### Problem

- import path logic was patched once, but still needs explicit tests
- custom root path under repository root is fragile

#### Required fix

- add tests for:
  - scan whole repository root
  - scan nested subfolder under repository root
  - reject path traversal / outside-root scans unless explicitly intended

### B4. Metadata provider parsing is too generic for completion claims

#### Problem

- provider is currently regex-based generic HTML parsing
- extracted metadata is likely shallow and inconsistent
- track list, tags, voice actors, and release data are not truly implemented for real providers

#### Required fix

- either implement provider-specific parsing for claimed providers, or
- narrow the claim to “basic metadata preview”

#### Required output

- explicit support matrix:
  - supported fields
  - unsupported fields
  - provider-specific caveats

## Section C - Missing MVP Features or Under-Delivered Areas

These are the main capability gaps relative to the original project intent.

### C1. Metadata apply workflow is incomplete

Current state:

- fetch stores preview in `MetadataJob`
- no clear admin flow to apply metadata into the actual work model

Required:

- admin can apply fetched metadata to a selected work
- field merge policy must be defined:
  - overwrite empty only, or
  - preview with per-field selection, or
  - full replace with confirmation

Recommended default:

- preview + per-field apply is ideal
- if too large, at minimum do “fill empty fields only” with explicit confirmation

### C2. Track/cover ingestion consistency

Current state:

- cover path and track file path are stored, but not clearly normalized across repository types

Required:

- define canonical path storage rules
- ensure cover rendering works for local and remote repositories
- avoid storing raw local-only assumptions in domain records

### C3. Admin review operations are incomplete

Required admin actions still missing or underdeveloped:

- merge duplicate works
- split wrongly grouped works
- reassign tracks between works
- apply metadata preview to existing work
- mark duplicate review resolved

### C4. Repository capability matrix is missing

Required:

- define which repository operations are supported for each type

Minimum matrix:

- local: list, exists, metadata, stream
- OpenList: list, exists, metadata, stream
- WebDAV: list, exists, metadata, stream

If any cell is uncertain, mark it experimental.

### C5. Real OpenList integration test is missing

Because the user explicitly wants OpenList/cloud integration, this is not optional for acceptance of that claim.

Required:

- test with the user's actual OpenList server
- use at least one mounted media source
- confirm browse + stream works through ARSM

## Section D - Tests to Add or Strengthen

### Required automated tests

- metadata provider capability gating
- title search rejection or support path
- import duplicate detection
- import job review status
- local range streaming
- malformed range handling
- repository path normalization
- OpenList adapter URL/path joining logic

### Required manual validation

- import same work twice
- import nested folder under repository root
- browser seek on large local audio file
- browser seek on remote/OpenList audio file
- metadata fetch by URL
- metadata fetch by code
- title mode only if actually supported

## Section E - Documentation Truth Pass

The following artifacts must be updated after fixes:

- `README.md`
- acceptance checklist
- any “project completed” notes
- deployment instructions if repo integration changes

### Documentation rules

- do not claim support for title metadata search unless implemented
- do not claim OpenList/WebDAV support as complete unless validated
- do not claim duplicate review queue unless import actually enters review state
- do not claim production-safe playback unless streaming is fixed

## Section F - Recommended Execution Order

### Pass 1

- fix metadata title support mismatch
- fix duplicate import review behavior
- fix streaming implementation

### Pass 2

- validate and correct OpenList/WebDAV adapter
- add real repository capability notes
- add missing tests

### Pass 3

- implement metadata apply flow
- improve admin review tools
- clean README and completion notes

## Section G - Merge Readiness Checklist

The branch is merge-ready only when all of the following are true:

- no user-visible action fails due to an unimplemented code path
- duplicate imports are intercepted or explicitly reviewed
- playback is streamed, not whole-file buffered
- OpenList/WebDAV support is either validated or labeled experimental
- README contains no false feature claims
- local repo is attached to the actual GitHub repository state

## Final Instruction to Implementation Agent

Do not spend time on visual polish before the blocking and truth-alignment issues are fixed.

The correct goal for the next round is:

- make the current claims true, or
- reduce the claims to match the implemented reality

No new large features should be added until the mismatches above are resolved.
