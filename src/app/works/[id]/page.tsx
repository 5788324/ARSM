import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect('/login');

  const { id } = await params;

  const work = await prisma.work.findUnique({
    where: { id },
    include: {
      circle: true,
      tracks: {
        orderBy: { trackNumber: 'asc' },
        include: {
          trackFiles: {
            include: { repository: true },
          },
        },
      },
      workTags: { include: { tag: true } },
      workVAs: { include: { voiceActor: true } },
      workSources: true,
    },
  });

  if (!work) notFound();

  const totalDuration = work.tracks.reduce((sum, t) => sum + (t.durationSec || 0), 0);
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/works" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Library
        </Link>
      </div>

      {/* Header */}
      <div className="flex gap-6">
        {/* Cover */}
        <div className="h-48 w-48 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          {work.coverPath ? (
            <img
              src={work.coverPath}
              alt={work.displayTitle}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">
              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{work.displayTitle}</h1>
          {work.originalTitle && work.originalTitle !== work.displayTitle && (
            <p className="mt-1 text-sm text-zinc-500">{work.originalTitle}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {work.workCode && (
              <span className="rounded bg-zinc-100 px-2 py-0.5 font-mono text-xs dark:bg-zinc-800">
                {work.workCode}
              </span>
            )}
            {work.circle && (
              <span className="text-zinc-600 dark:text-zinc-400">{work.circle.name}</span>
            )}
          </div>

          {/* Tags */}
          {work.workTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {work.workTags.map((wt) => (
                <span
                  key={wt.id}
                  className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  {wt.tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Voice Actors */}
          {work.workVAs.length > 0 && (
            <div className="mt-2 text-sm text-zinc-500">
              CV:{' '}
              {work.workVAs.map((wva) => wva.voiceActor.name).join(', ')}
            </div>
          )}

          {work.releaseDate && (
            <p className="mt-1 text-sm text-zinc-500">Released: {work.releaseDate}</p>
          )}

          <p className="mt-1 text-sm text-zinc-400">
            {work.tracks.length} tracks · {formatDuration(totalDuration)}
          </p>
        </div>
      </div>

      {/* Description */}
      {work.description && (
        <div className="mt-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
            {work.description}
          </p>
        </div>
      )}

      {/* Track list */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold">Tracks</h2>
        <div className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {work.tracks.map((track) => {
            const file = track.trackFiles[0];
            return (
              <div
                key={track.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="w-6 text-center text-xs text-zinc-400">
                  {String(track.trackNumber).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.title}</p>
                  {track.durationSec && (
                    <p className="text-xs text-zinc-500">
                      {formatDuration(track.durationSec)}
                      {track.bitrateKbps && ` · ${track.bitrateKbps} kbps`}
                    </p>
                  )}
                </div>
                {file ? (
                  <audio controls preload="none" className="h-8 w-48">
                    <source
                      src={`/api/tracks/${track.id}/stream`}
                      type={track.mimeType || 'audio/mpeg'}
                    />
                  </audio>
                ) : (
                  <span className="text-xs text-red-500">No file</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sources */}
      {work.workSources.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Sources</h2>
          <div className="mt-2 space-y-1">
            {work.workSources.map((src) => (
              <div key={src.id} className="text-sm">
                <a
                  href={src.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {src.sourceName}
                </a>
                <span className="ml-2 text-xs text-zinc-400">
                  fetched {new Date(src.fetchedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
