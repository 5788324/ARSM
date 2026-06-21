'use client';

import { useEffect, useState, useCallback } from 'react';

interface Provider { id: string; displayName: string; canDownload: boolean; }

interface ProgressData {
  inspect?: { fileCount: number; totalSize: number; title?: string };
  download?: { totalFiles: number; doneFiles: number; failedFiles: number; bytesDownloaded: number; totalBytes?: number; percent?: number; currentFile?: string; files?: { path: string; size: number; downloaded: number; percent: number; status: string; error?: string }[] };
  import?: { foundWorks: number; foundTracks: number; reviewCount?: number; errors?: string[] };
}

interface JobItem {
  id: string; providerId: string; input: string; normalizedSourceId?: string; targetDir: string;
  status: string; currentStep?: string | null;
  progressJson?: string | null; resultJson?: string | null; errorJson?: string | null;
  createdAt: string; startedAt?: string | null; finishedAt?: string | null;
}

const statusLabels: Record<string, string> = {
  pending: '等待中', inspecting: '探测中', downloading: '下载中', importing: '导入中',
  postprocessing: '后处理', done: '已完成', review: '待审查', done_with_errors: '部分失败', failed: '失败',
};
const stepLabels: Record<string, string> = { inspect: '探测', download: '下载', import: '导入', postprocess: '后处理' };

function formatSize(b: number) { if (b > 1e9) return `${(b/1e9).toFixed(1)} GB`; if (b > 1e6) return `${(b/1e6).toFixed(1)} MB`; return `${(b/1e3).toFixed(0)} KB`; }
function parseJson<T>(json: string | null | undefined): T | null { if (!json) return null; try { return JSON.parse(json); } catch { return null; } }

export default function AcquisitionPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState('asmrone');
  const [input, setInput] = useState('');
  const [targetDir, setTargetDir] = useState('C:/Users/YANG/Music/arsm.one');
  const [autoImport, setAutoImport] = useState(true);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pr, jr] = await Promise.all([fetch('/api/acquisition/providers'), fetch('/api/acquisition/jobs')]);
      const [pd, jd] = await Promise.all([pr.json(), jr.json()]);
      if (pd.ok) setProviders(pd.data);
      if (jd.ok) setJobs(jd.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const hasRunning = jobs.some((j) => ['pending', 'inspecting', 'downloading', 'importing', 'postprocessing'].includes(j.status));
    if (!hasRunning) return;
    const t = setInterval(fetchData, 3000);
    return () => clearInterval(t);
  }, [jobs, fetchData]);

  const handleCreate = async () => {
    if (!input) return;
    setCreating(true); setMsg('');
    try {
      const res = await fetch('/api/acquisition/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, input, targetDir, autoImport }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg(`✅ 任务已创建: ${data.data.id.slice(-8)}`);
      setInput(''); fetchData();
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : '创建失败'}`);
    } finally { setCreating(false); }
  };

  const toggleExpand = (id: string) => {
    setExpandedJobs((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">采集任务</h1>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">新建采集任务</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div><label className="block text-sm font-medium">来源</label>
            <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
              {providers.map((p) => <option key={p.id} value={p.id}>{p.displayName}{p.canDownload ? '' : ' (仅元数据)'}</option>)}</select></div>
          <div><label className="block text-sm font-medium">RJ 编号</label>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="RJ01538000" className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" /></div>
          <div><label className="block text-sm font-medium">下载目录</label>
            <input type="text" value={targetDir} onChange={(e) => setTargetDir(e.target.value)} className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" /></div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoImport} onChange={(e) => setAutoImport(e.target.checked)} />自动导入</label>
            <button onClick={handleCreate} disabled={creating || !input} className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">{creating ? '创建中...' : '开始采集'}</button>
          </div>
        </div>
        {msg && <p className={`mt-3 text-sm ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}
      </div>

      <h2 className="mt-8 text-lg font-semibold">任务列表</h2>
      {loading ? <p className="mt-2 text-sm text-zinc-500">加载中...</p> : jobs.length === 0 ? <p className="mt-2 text-sm text-zinc-500">还没有采集任务。</p> : (
        <div className="mt-3 space-y-3">
          {jobs.map((job) => {
            const progress = parseJson<ProgressData>(job.progressJson);
            const download = progress?.download;
            const isExpanded = expandedJobs.has(job.id);

            return (
              <div key={job.id} className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                <div className="p-4 cursor-pointer" onClick={() => toggleExpand(job.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-mono dark:bg-zinc-800">{job.providerId}</span>
                      <span className="text-sm font-medium truncate">{job.normalizedSourceId || job.input}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        job.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        job.status === 'done_with_errors' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                        job.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      }`}>{statusLabels[job.status] || job.status}</span>
                    </div>
                  </div>

                  {download && (
                    <div className="mt-2">
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div className={`h-full rounded-full transition-all ${download.percent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                          style={{ width: `${download.percent || 0}%` }} />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500">
                        <span>{download.doneFiles}/{download.totalFiles} 文件</span>
                        <span>{formatSize(download.bytesDownloaded)} / {download.totalBytes ? formatSize(download.totalBytes) : '?'}</span>
                        {download.currentFile && <span className="truncate max-w-48">📄 {download.currentFile.split('/').pop()}</span>}
                        {job.currentStep && <span>步骤: {stepLabels[job.currentStep]}</span>}
                      </div>
                    </div>
                  )}
                </div>

                {isExpanded && download?.files && download.files.length > 0 && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 max-h-60 overflow-auto">
                    <h4 className="text-xs font-medium text-zinc-500 mb-2">下载文件列表</h4>
                    {download.files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-1 text-xs border-b border-zinc-50 dark:border-zinc-800/50">
                        <span className={`truncate flex-1 mr-2 ${f.status === 'failed' ? 'text-red-500' : f.status === 'downloading' ? 'text-blue-500' : f.status === 'done' ? 'text-green-600' : 'text-zinc-400'}`}>
                          {f.status === 'downloading' ? '⬇' : f.status === 'done' ? '✅' : f.status === 'failed' ? '❌' : '⏳'} {f.path.split('/').pop()}
                        </span>
                        <span className="flex-shrink-0 text-zinc-400">{formatSize(f.size)}</span>
                        {f.percent > 0 && f.status === 'downloading' && (
                          <div className="w-16 h-1 ml-2 rounded-full bg-zinc-200 dark:bg-zinc-700"><div className="h-full rounded-full bg-blue-500" style={{width:`${f.percent}%`}}/></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && job.status === 'done' && job.resultJson && (() => { try {
                  const r = JSON.parse(job.resultJson);
                  if (r.inspect && !download?.files) {
                    return (<div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                      <h4 className="text-xs font-medium text-zinc-500 mb-2">元数据预览</h4>
                      {r.inspect.title && <p>标题：{r.inspect.title}</p>}
                      {r.inspect.circle && <p>社团：{r.inspect.circle}</p>}
                      {r.inspect.source && <p>来源：{r.inspect.source}</p>}
                      {r.inspect.sourceUrl && <a href={r.inspect.sourceUrl} target="_blank" className="text-blue-600 hover:underline block mt-1">{r.inspect.sourceUrl}</a>}
                    </div>);
                  }
                } catch {}; return null; })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
