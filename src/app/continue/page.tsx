import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function ContinueListeningPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const history = await prisma.listeningHistory.findMany({
    where: { userId: session.user!.id! },
    orderBy: { listenedAt: 'desc' },
    take: 30,
    include: {
      work: {
        include: {
          circle: true,
          _count: { select: { tracks: true } },
          tracks: { orderBy: { trackNumber: 'asc' }, take: 1 },
        },
      },
    },
  });

  // Get favorites for badge
  const favWorkIds = new Set(
    (await prisma.favorite.findMany({
      where: { userId: session.user!.id! },
      select: { workId: true },
    })).map((f) => f.workId),
  );

  const formatPosition = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">继续收听</h1>
        <Link href="/works" className="text-sm text-zinc-500 hover:text-zinc-700">← 作品库
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg text-zinc-500">还没有收听记录。</p>
          <Link
            href="/works"
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            浏览作品库
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {history.map((h) => {
            const workDuration = h.work.durationSec || 1;
            const progress = Math.min((h.positionSec / workDuration) * 100, 100);
            const isFav = favWorkIds.has(h.workId);

            return (
              <Link
                key={h.id}
                href={`/works/${h.work.id}`}
                className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                {/* Cover thumbnail */}
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  {h.work.coverPath ? (
                    <img src={`/api/covers/${h.work.id}`} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-300">♪</div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{h.work.displayTitle}</p>
                    {isFav && <span className="text-xs">⭐</span>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                    {h.work.circle && <span>{h.work.circle.name}</span>}
                    <span>·</span>
                    {h.work._count.tracks} 首
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className="h-full rounded-full bg-zinc-600 dark:bg-zinc-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-0.5 flex justify-between text-xs text-zinc-400">
                    <span>{formatPosition(h.positionSec)}</span>
                    <span>
                      {h.listenedAt.toLocaleDateString()}{' '}
                      {h.listenedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Resume button */}
                <div className="flex-shrink-0">
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium dark:bg-zinc-800">
                  续听
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
