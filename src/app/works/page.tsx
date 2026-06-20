'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface WorkCard { id: string; displayTitle: string; workCode: string | null; coverPath: string | null; circle: { name: string } | null; _count: { tracks: number }; }

export default function WorksPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [keyword, setKeyword] = useState(sp.get('keyword') || '');
  const [sort, setSort] = useState(sp.get('sort') || 'recent');
  const [hasSubtitle, setHasSubtitle] = useState(sp.get('hasSubtitle') === 'true');
  const [works, setWorks] = useState<WorkCard[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(parseInt(sp.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchWorks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (sort !== 'recent') params.set('sort', sort);
    if (hasSubtitle) params.set('hasSubtitle', 'true');
    params.set('page', String(page));
    params.set('pageSize', '24');

    const res = await fetch(`/api/works/search?${params}`);
    const data = await res.json();
    if (data.ok) { setWorks(data.data.works); setTotal(data.data.total); setTotalPages(data.data.totalPages); }
    setLoading(false);
  }, [keyword, sort, hasSubtitle, page]);

  useEffect(() => { fetchWorks(); }, [fetchWorks]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchWorks(); };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">作品库</h1>
        <span className="text-sm text-zinc-500">{total} 个作品</span>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-6">
        <input type="search" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索作品/编号/社团/声优/标签..." className="flex-1 min-w-[200px] rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800" />
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
          <option value="recent">最新导入</option>
          <option value="title">标题排序</option>
          <option value="tracks">曲目数</option>
        </select>
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={hasSubtitle} onChange={(e) => { setHasSubtitle(e.target.checked); setPage(1); }} /> 带字幕</label>
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">搜索</button>
      </form>

      {loading ? <p className="text-zinc-500">加载中...</p> : works.length === 0 ? (
        <div className="mt-16 text-center"><p className="text-lg text-zinc-500">没有找到匹配的作品。</p></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {works.map((w) => (
              <Link key={w.id} href={`/works/${w.id}`} className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800">
                  {w.coverPath ? <img src={`/api/covers/${w.id}`} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-zinc-400 text-3xl">♪</div>}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium truncate">{w.displayTitle}</h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    {w.circle && <span>{w.circle.name}</span>}
                    {w.workCode && <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">{w.workCode}</span>}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{w._count.tracks} 首曲目</p>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`rounded px-3 py-1 text-sm ${p === page ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'}`}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
