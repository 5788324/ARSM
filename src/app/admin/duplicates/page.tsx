'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface DuplicateGroup {
  reason: string;
  code?: string;
  titlePrefix?: string;
  works: WorkSummary[];
}

interface WorkSummary {
  id: string;
  displayTitle: string;
  workCode?: string;
  circle?: { name: string };
  _count: { tracks: number };
  createdAt: string;
  updatedAt: string;
}

interface DuplicatesResponse {
  total: number;
  groups: DuplicateGroup[];
}

export default function DuplicatesPage() {
  const [data, setData] = useState<DuplicatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/duplicates')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMerge = async (targetId: string, sourceIds: string[]) => {
    if (!confirm(`将 ${sourceIds.length} 个作品合并到目标？不可撤销。`)) return;
    setMerging(targetId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, sourceIds }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || '合并失败');
      setMessage(`合并了 ${result.mergedSources} 个作品：${result.mergedTracks} 首曲目，${result.mergedTags} 个标签。`);
      fetchData();
    } catch (err) {
      setMessage(`错误：${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setMerging(null);
    }
  };

  if (loading) return (
    <div className="mx-auto max-w-4xl px-4 py-8"><p className="text-zinc-500">正在扫描重复项...</p></div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">重复审查</h1>
      <p className="mt-1 text-sm text-zinc-500">可能重复的作品 — 相同编号或高度相似标题。</p>

      {message && (
        <div className={`mt-4 rounded-lg p-3 text-sm ${
          message.startsWith('错误')
            ? 'border border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400'
            : 'border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
        }`}>{message}</div>
      )}

      {!data || data.total === 0 ? (
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950">
          <p className="text-green-700 dark:text-green-300">未发现重复作品。</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {data.groups.map((group, gi) => (
            <div key={gi} className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                  {group.reason === 'duplicate_code' ? '相同编号' : '相似标题'}
                </span>
                {group.code && <code className="rounded bg-white px-1.5 py-0.5 text-xs dark:bg-zinc-800">{group.code}</code>}
                {group.titlePrefix && <span className="text-xs text-zinc-500">&quot;{group.titlePrefix}...&quot;</span>}
                {group.works.length > 1 && (
                  <button
                    onClick={() => { const [target, ...sources] = group.works; handleMerge(target.id, sources.map((s) => s.id)); }}
                    disabled={!!merging}
                    className="ml-auto rounded bg-amber-600 px-2 py-1 text-xs text-white hover:bg-amber-700 disabled:opacity-50"
                  >{merging ? '合并中...' : '全部合并'}</button>
                )}
              </div>

              <div className="mt-3 space-y-2">
                {group.works.map((work, wi) => (
                  <div key={work.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{work.displayTitle}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                        {work.circle && <span>{work.circle.name}</span>}
                        {work.workCode && <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">{work.workCode}</code>}
                        <span>·</span>
                        <span>{work._count.tracks} 首</span>
                        <span>·</span>
                        <span>{new Date(work.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <Link href={`/works/${work.id}`} className="text-xs text-zinc-400 hover:text-zinc-600">查看 →</Link>
                      {group.works.length > 1 && wi > 0 && (
                        <button
                          onClick={() => handleMerge(group.works[0].id, [work.id])}
                          disabled={!!merging}
                          className="rounded bg-zinc-200 px-2 py-1 text-xs hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                        >合并至此 ↑</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
