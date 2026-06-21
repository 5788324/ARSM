import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function ContinueListeningPage() {
  const session = await auth();
  if (!session) redirect('/login');
  const uid = session.user?.id || '';

  const [history, playCount, distinctWorks, totalSec, topWorksAgg] = await Promise.all([
    prisma.listeningHistory.findMany({
      where: { userId: uid },
      orderBy: { listenedAt: 'desc' },
      take: 30,
      include: { work: { include: { circle: true, _count: { select: { tracks: true } }, tracks: { orderBy: { trackNumber: 'asc' }, take: 1 } } } },
    }),
    (prisma as any).playLog.count({ where: { userId: uid } }) as Promise<number>,
    prisma.listeningHistory.groupBy({ by: ['workId'], where: { userId: uid } }).then(r => r.length),
    (prisma as any).playLog.aggregate({ where: { userId: uid }, _sum: { listenedSec: true } }).then((r: any) => r._sum?.listenedSec || 0) as Promise<number>,
    (prisma as any).playLog.groupBy({ by: ['workId'], where: { userId: uid }, _count: true, orderBy: { _count: { workId: 'desc' } }, take: 5 }) as Promise<any[]>,
  ]);

  const formatPosition = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  const totalPlaySec = Number(totalSec) || 0;
  const fmtDur = (sec: number) => sec >= 3600 ? `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m` : `${Math.floor(sec / 60)}m`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">收听统计</h1>
        <Link href="/works" className="text-sm text-zinc-500 hover:text-zinc-700">← 作品库</Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">播放次数</p>
          <p className="text-2xl font-bold">{playCount}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">收听作品</p>
          <p className="text-2xl font-bold">{distinctWorks}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">总收听时长</p>
          <p className="text-2xl font-bold">{fmtDur(totalPlaySec)}</p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">最近播放</h2>
      {history.length === 0 ? (
        <div className="mt-4 text-center"><p className="text-zinc-500">还没有收听记录。</p></div>
      ) : (
        <div className="mt-4 space-y-2">
          {history.map((h) => {
            const workDuration = h.work.durationSec || 1;
            const progress = Math.min((h.positionSec / workDuration) * 100, 100);
            return (
              <Link key={h.id} href={`/works/${h.work.id}`} className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  {h.work.coverPath ? <img src={`/api/covers/${h.work.id}`} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-zinc-300">♪</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{h.work.displayTitle}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    {h.work.circle && <span>{h.work.circle.name}</span>}
                    <span>·</span><span>{h.work._count.tracks} 首</span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div className="h-full rounded-full bg-zinc-600 dark:bg-zinc-400" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-0.5 flex justify-between text-xs text-zinc-400">
                    <span>{formatPosition(h.positionSec)}</span>
                    <span>{h.listenedAt.toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium dark:bg-zinc-800">续听</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
