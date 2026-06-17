# ARSM — Private Audio Library

A private web-based ASMR/audio library with Kikoeru/asmr.one-style browsing,
built for a single owner or small trusted household.

## Tech Stack

- **Frontend & API**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (Prisma ORM) — PostgreSQL-ready via one-line config change
- **Auth**: NextAuth v5 (Credentials + JWT sessions)
- **Styling**: Tailwind CSS 4
- **Media**: ffmpeg/ffprobe for metadata extraction, HTML5 audio playback
- **Storage**: Local, OpenList, WebDAV (pluggable RepositoryAdapter pattern)
- **Testing**: Vitest (9 tests)
- **Deploy**: Docker + docker compose

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm
- ffmpeg/ffprobe (for import scanner)

### Local Dev

```bash
pnpm install
cp .env.example .env
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
pnpm dev
# → http://localhost:3000
# Username: admin / Password: admin (configurable in .env)
```

### Docker

```bash
cp .env.example .env
# Edit .env with your settings
docker compose up -d
# → http://localhost:3000
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/              # 6 admin pages
│   ├── api/                # 11 API routes
│   ├── login/              # Auth page
│   ├── works/              # Library + Work detail
│   ├── favorites/          # Favorites page
│   ├── continue/           # Listening history
│   ├── proxy.ts            # Auth guard
│   └── page.tsx            # Home dashboard
├── components/
│   └── mobile-nav.tsx      # Mobile bottom navigation
├── lib/
│   ├── auth.ts             # NextAuth config
│   ├── prisma.ts           # Prisma client
│   ├── repository/         # Adapter interfaces + implementations
│   ├── scanner.ts          # Import scanner (ffprobe)
│   └── metadata/           # Metadata providers
prisma/
├── schema.prisma           # 15 database models
└── seed.ts                 # Admin user seeder
```

## Features

### Core (MVP)
- Auth: credentials + JWT sessions, route protection
- Import: recursive folder scan → ffprobe metadata → auto-group into works
- Library: browse works by cover, circle, tags, voice actors
- Playback: HTML5 audio with seek support (Range requests), resume progress
- Search: full-text by title/code, filter by circle/tag/voice actor
- Favorites: toggle on work detail, browse favorites page
- History: persist listening position, continue-listening shelf
- PWA: manifest.json, Apple Web App meta, mobile bottom nav

### Admin
- Import: scan local folders, preview results, monitor jobs
- Metadata: fetch from dlsite/asmr.one by URL, code, or title
- Repositories: manage local/OpenList/WebDAV backends, health checks
- Duplicates: detect by work code or similar titles
- Jobs: monitor import/metadata job history
- Audit: check file availability across repositories

### Advanced
- RepositoryAdapter: pluggable storage (local → OpenList → WebDAV)
- MetadataProvider: pluggable metadata sources
- Remote streaming: proxy OpenList/WebDAV media
- Duplicate detection: code-based + title-similarity
- Docker: single-command production deployment

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm test` | Run tests (vitest) |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |
| `pnpm db:push` | Push schema to DB |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:seed` | Reset admin password |

## Migrating to PostgreSQL

1. Install PostgreSQL
2. `prisma/schema.prisma`: change `provider = "sqlite"` → `"postgresql"`
3. `.env`: update `DATABASE_URL` to PG connection string
4. `npx prisma db push`

## Bug Fixes (this session)

| Issue | Status |
|-------|--------|
| Import path double-join (repo.rootPath + scanRoot) | ✅ Fixed |
| Mobile nav hidden on /login?error=... | ✅ Fixed |
| Debug API route exposed | ✅ Removed |
| Scanner dead code (coverMimeType) | ✅ Cleaned |
| Seed script password re-hash | ✅ Fixed |
| Login CredentialsSignin error handling | ✅ Fixed |

## License

Private — single owner use.
