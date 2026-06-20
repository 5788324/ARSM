'use client';

import Link from 'next/link';

export function HomeClient({ data }: { data: any }) {
  const { recentWorks, recentImports, listeningHistory, totalWorks, totalTracks } = data;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">ARSM</h1>
        <p className="mt-1 text-zinc-500">私人音频图书馆 · {totalWorks} 作品 · {totalTracks} 曲目</p>
      </div>

      <div className="grid gap-8">
        {/* Recently added */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">最近添加</h2>
            <Link href="/works" className="text-sm text-blue-600 hover:underline dark:text-blue-400">全部作品 →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentWorks.map((w: any) => (
              <Link key={w.id} href={`/works/${w.id}`} className="flex gap-3 rounded-xl border border-zinc-200 p-3 hover:shadow dark:border-zinc-800">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  {w.coverPath ? <img src={`/api/covers/${w.id}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-zinc-400 text-xl">♪</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{w.displayTitle}</p>
                  <p className="text-xs text-zinc-500">{w.circle?.name || ''}{w.workCode ? ` · ${w.workCode}` : ''}</p>
                  <p className="text-xs text-zinc-400">{w._count.tracks} 首</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent imports */}
        {recentImports.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">最近采集</h2>
              <Link href="/admin/acquisition" className="text-sm text-blue-600 hover:underline dark:text-blue-400">采集任务 →</Link>
            </div>
            <div className="space-y-2">
              {recentImports.map((j: any) => (
                <div key={j.id} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono dark:bg-zinc-800">{j.providerId}</span>
                  <span className="flex-1 truncate">{j.normalizedSourceId || j.input}</span>
                  <span className="text-xs text-zinc-500">{j.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Continue listening */}
        {listeningHistory?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">最近播放</h2>
              <Link href="/works" className="text-sm text-blue-600 hover:underline dark:text-blue-400">全部作品 →</Link>
            </div>
            <div className="space-y-2">
              {listeningHistory.map((h: any) => (
                <Link key={h.id} href={`/works/${h.workId}`} className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 hover:shadow dark:border-zinc-800">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {h.work?.coverPath ? <img src={`/api/covers/${h.work.id}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-zinc-400">♪</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{h.work?.displayTitle || '未知作品'}</p>
                    <p className="text-xs text-zinc-500">{h.positionSec > 0 ? `${Math.floor(h.positionSec/60)}:${String(h.positionSec%60).padStart(2,'0')}` : '已完成'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Quick links */}
        <section>
          <h2 className="text-lg font-semibold mb-3">快捷入口</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/works" className="rounded-xl border border-zinc-200 p-4 hover:shadow dark:border-zinc-800">
              <p className="font-medium">作品库</p>
              <p className="text-xs text-zinc-500 mt-1">浏览和搜索所有作品</p>
            </Link>
            <Link href="/admin/acquisition" className="rounded-xl border border-zinc-200 p-4 hover:shadow dark:border-zinc-800">
              <p className="font-medium">采集任务</p>
              <p className="text-xs text-zinc-500 mt-1">下载新作品</p>
            </Link>
            <Link href="/admin" className="rounded-xl border border-zinc-200 p-4 hover:shadow dark:border-zinc-800">
              <p className="font-medium">管理面板</p>
              <p className="text-xs text-zinc-500 mt-1">元数据、导入、仓库</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
