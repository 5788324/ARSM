'use client';

import { useEffect, useState } from 'react';

interface ReviewCandidate {
  folderName: string;
  folderCode: string | null;
  trackCount: number;
  candidateWorks: { id: string; title: string; code: string | null }[];
}

interface ImportJob {
  id: string;
  status: string;
  totalFiles: number;
  foundWorks: number;
  foundTracks: number;
  errors: string | null;
  reviewPayload: string | null;
  createdAt: string;
  finishedAt: string | null;
}

interface MetadataJob {
  id: string;
  queryType: string;
  queryValue: string;
  provider: string;
  status: string;
  resultJson: string | null;
  createdAt: string;
  finishedAt: string | null;
}

interface JobStatus {
  stats: { works: number; tracks: number; circles: number };
  importJobs: ImportJob[];
  metadataJobs: MetadataJob[];
}

const statusLabel: Record<string, string> = {
  pending: '等待中', running: '运行中', done: '已完成',
  failed: '失败', review: '待审查', done_with_errors: '部分失败',
};

export default function JobsPage() {
  const [data, setData] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch('/api/admin/jobs')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleMerge = async (targetId: string, sourceIds: string[]) => {
    if (!confirm(`将 ${sourceIds.length} 个候选合并到目标？不可撤销。`)) return;
    const res = await fetch('/api/admin/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId, sourceIds }),
    });
    if (res.ok) fetchData();
  };

  if (loading) return (
    <div className="mx-auto max-w-4xl px-4 py-8"><p className="text-zinc-500">加载中...</p></div>
  );

  if (!data) return (
    <div className="mx-auto max-w-4xl px-4 py-8"><p className="text-red-500">加载任务失败。</p></div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">任务状态</h1>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
          <p className="text-2xl font-bold">{data.stats.works}</p><p className="text-xs text-zinc-500">作品</p></div>
        <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
          <p className="text-2xl font-bold">{data.stats.tracks}</p><p className="text-xs text-zinc-500">曲目</p></div>
        <div className="rounded-xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
          <p className="text-2xl font-bold">{data.stats.circles}</p><p className="text-xs text-zinc-500">社团</p></div>
      </div>

      {/* Import Jobs */}
      <h2 className="mt-8 text-lg font-semibold">导入任务</h2>
      {data.importJobs.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">还没有导入任务。</p>
      ) : (
        <div className="mt-3 space-y-3">
          {data.importJobs.map((job) => {
            let reviewCandidates: ReviewCandidate[] = [];
            try { if (job.reviewPayload) reviewCandidates = JSON.parse(job.reviewPayload); } catch {}

            return (
              <div key={job.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">导入 #{job.id.slice(-6)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    job.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    job.status === 'done_with_errors' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                    job.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                    job.status === 'review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>{statusLabel[job.status] || job.status}</span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2 text-xs text-zinc-500">
                  <div>文件：<span className="font-medium text-zinc-700 dark:text-zinc-300">{job.totalFiles}</span></div>
                  <div>作品：<span className="font-medium text-zinc-700 dark:text-zinc-300">{job.foundWorks}</span></div>
                  <div>曲目：<span className="font-medium text-zinc-700 dark:text-zinc-300">{job.foundTracks}</span></div>
                  <div>{new Date(job.createdAt).toLocaleDateString()}</div>
                </div>

                {/* Review candidates */}
                {reviewCandidates.length > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                      ⚠ {reviewCandidates.length} 个待审查候选
                    </p>
                    {reviewCandidates.map((rc, i) => (
                      <div key={i} className="mt-2 rounded border border-amber-100 bg-white p-2 text-xs dark:border-amber-700 dark:bg-zinc-900">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{rc.folderName}</span>
                            {rc.folderCode && <span className="text-zinc-500 mr-2"> [{rc.folderCode}]</span>}
                            <span className="text-zinc-400">{rc.trackCount} 首</span>
                          </div>
                          {rc.candidateWorks.length > 1 && (
                            <button
                              onClick={() => {
                                const [target, ...sources] = rc.candidateWorks;
                                handleMerge(target.id, sources.map((s) => s.id));
                              }}
                              className="rounded bg-amber-600 px-2 py-0.5 text-xs text-white hover:bg-amber-700"
                            >合并候选作品</button>
                          )}
                        </div>
                        <p className="mt-1 text-zinc-500">候选匹配：</p>
                        {rc.candidateWorks.map((cw) => (
                          <div key={cw.id} className="ml-2 mt-0.5 flex items-center gap-2">
                            <a href={`/works/${cw.id}`} className="text-blue-600 hover:underline" target="_blank">{cw.title}</a>
                            {cw.code && <code className="text-zinc-400">[{cw.code}]</code>}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {job.errors && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-red-500">
                      {JSON.parse(job.errors).length} 个错误
                    </summary>
                    <pre className="mt-1 max-h-32 overflow-auto rounded bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-400">
                      {JSON.stringify(JSON.parse(job.errors), null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Metadata Jobs */}
      <h2 className="mt-8 text-lg font-semibold">元数据任务</h2>
      {data.metadataJobs.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">还没有元数据任务。</p>
      ) : (
        <div className="mt-3 space-y-3">
          {data.metadataJobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-mono dark:bg-zinc-800">{job.provider}</span>
                  <span className="text-sm">{job.queryType}: {job.queryValue}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  job.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  job.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                }`}>{statusLabel[job.status] || job.status}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">{new Date(job.createdAt).toLocaleString()}</p>
              {job.resultJson && job.status === 'done' && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-zinc-500">预览结果</summary>
                  <pre className="mt-1 max-h-48 overflow-auto rounded bg-zinc-50 p-2 text-xs dark:bg-zinc-800">
                    {JSON.stringify(JSON.parse(job.resultJson), null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
