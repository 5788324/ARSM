import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  const session = await auth();

  const [workCount, trackCount, circleCount, recentHistory] = await Promise.all([
    prisma.work.count(), prisma.track.count(), prisma.circle.count(),
    session ? prisma.listeningHistory.findMany({
      where: { userId: session.user!.id! },
      orderBy: { listenedAt: 'desc' }, take: 5,
      include: { work: { select: { id: true, displayTitle: true, coverPath: true, durationSec: true } } },
    }) : Promise.resolve([]),
  ]);

  const formatPos = (sec: number) => `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;

  return (
    <div className="flex min-h-screen flex-col">
      <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">ARSM</Link>
          <div className="flex items-center gap-4">
            <Link href="/works" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">作品库</Link>
            <Link href="/favorites" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">收藏</Link>
            <Link href="/admin" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">管理</Link>
            <span className="text-sm text-zinc-400">{session?.user?.name}</span>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }); }}>
              <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">退出</button>
            </form>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">你的私人音频图书馆</h2>
            <p className="mt-4 text-lg text-zinc-500">导入你的收藏，按社团或声优浏览，随时随地收听。</p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/works" className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">浏览作品库</Link>
              <Link href="/admin/import" className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">导入媒体</Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 text-center">
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800"><p className="text-3xl font-bold">{workCount}</p><p className="mt-1 text-sm text-zinc-500">作品</p></div>
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800"><p className="text-3xl font-bold">{trackCount}</p><p className="mt-1 text-sm text-zinc-500">曲目</p></div>
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800"><p className="text-3xl font-bold">{circleCount}</p><p className="mt-1 text-sm text-zinc-500">社团</p></div>
          </div>

          {recentHistory.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">继续收听</h2>
                <Link href="/continue" className="text-sm text-zinc-500 hover:text-zinc-700">查看全部 →</Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentHistory.map((h) => {
                  const progress = h.work.durationSec ? Math.min((h.positionSec / h.work.durationSec) * 100, 100) : 0;
                  return (
                    <Link key={h.id} href={`/works/${h.work.id}`} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 transition hover:shadow-sm dark:border-zinc-800">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        {h.work.coverPath ? <img src={h.work.coverPath} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-zinc-300">♪</div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{h.work.displayTitle}</p>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"><div className="h-full rounded-full bg-zinc-500" style={{ width: `${progress}%` }} /></div>
                        <p className="mt-0.5 text-xs text-zinc-400">{formatPos(h.positionSec)} · {new Date(h.listenedAt).toLocaleDateString()}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
