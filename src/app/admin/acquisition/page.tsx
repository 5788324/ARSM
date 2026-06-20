'use client';

import { useEffect, useState, useCallback } from 'react';

interface Provider {
  id: string;
  displayName: string;
}

interface JobItem {
  id: string;
  providerId: string;
  input: string;
  normalizedSourceId?: string;
  targetDir: string;
  status: string;
  currentStep?: string | null;
  progressJson?: string | null;
  resultJson?: string | null;
  errorJson?: string | null;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
}

const statusLabels: Record<string, string> = {
  pending: '等待中', inspecting: '探测中', downloading: '下载中',
  importing: '导入中', postprocessing: '后处理', done: '已完成',
  review: '待审查', done_with_errors: '部分失败', failed: '失败', cancelled: '已取消',
};

const stepLabels: Record<string, string> = {
  inspect: '探测', download: '下载', import: '导入', postprocess: '后处理',
};

export default function AcquisitionPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [providerId, setProviderId] = useState('asmrone');
  const [input, setInput] = useState('');
  const [targetDir, setTargetDir] = useState('C:/Users/YANG/Music/arsm.one');
  const [autoImport, setAutoImport] = useState(true);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');

  const [detailJob, setDetailJob] = useState<JobItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [provRes, jobRes] = await Promise.all([
        fetch('/api/acquisition/providers'),
        fetch('/api/acquisition/jobs'),
      ]);
      const provData = await provRes.json();
      const jobData = await jobRes.json();
      if (provData.ok) setProviders(provData.data);
      if (jobData.ok) setJobs(jobData.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 3 seconds when there are running jobs
  useEffect(() => {
    const hasRunning = jobs.some((j) => ['pending', 'inspecting', 'downloading', 'importing', 'postprocessing'].includes(j.status));
    if (!hasRunning) return;
    const timer = setInterval(fetchData, 3000);
    return () => clearInterval(timer);
  }, [jobs, fetchData]);

  const handleCreate = async () => {
    if (!input) return;
    setCreating(true);
    setMsg('');
    try {
      const res = await fetch('/api/acquisition/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, input, targetDir, autoImport }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setMsg(`✅ 任务已创建: ${data.data.id.slice(-8)}`);
      setInput('');
      fetchData();
    } catch (err) {
      setMsg(`❌ ${err instanceof Error ? err.message : '创建失败'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleViewDetail = async (id: string) => {
    const res = await fetch(`/api/acquisition/jobs?id=${id}`);
    const data = await res.json();
    if (data.ok) setDetailJob(data.data);
  };

  const parseProgress = (json: string | null | undefined) => {
    if (!json) return null;
    try { return JSON.parse(json); } catch { return null; }
  };

  const parseErrors = (json: string | null | undefined) => {
    if (!json) return null;
    try { return JSON.parse(json); } catch { return null; }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">采集任务</h1>

      {/* Create form */}
      <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-semibold">新建采集任务</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">来源</label>
            <select value={providerId} onChange={(e) => setProviderId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
              {providers.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">RJ 编号 / URL</label>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="RJ01538000" className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
          </div>
          <div>
            <label className="block text-sm font-medium">下载目录</label>
            <input type="text" value={targetDir} onChange={(e) => setTargetDir(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={autoImport} onChange={(e) => setAutoImport(e.target.checked)} />
              自动导入
            </label>
            <button onClick={handleCreate} disabled={creating || !input}
              className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
              {creating ? '创建中...' : '开始采集'}
            </button>
          </div>
        </div>
        {msg && <p className={`mt-3 text-sm ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>}
      </div>

      {/* Job list */}
      <h2 className="mt-8 text-lg font-semibold">任务列表</h2>
      {loading ? (
        <p className="mt-2 text-sm text-zinc-500">加载中...</p>
      ) : jobs.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">还没有采集任务。</p>
      ) : (
        <div className="mt-3 space-y-2">
          {jobs.map((job) => {
            const progress = parseProgress(job.progressJson);
            return (
              <div key={job.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
                onClick={() => handleViewDetail(job.id)}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-mono dark:bg-zinc-800">{job.providerId}</span>
                    <span className="text-sm font-medium truncate">{job.normalizedSourceId || job.input}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      job.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                      job.status === 'done_with_errors' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                      job.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                      job.status === 'review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    }`}>{statusLabels[job.status] || job.status}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                    {job.currentStep && <span>步骤: {stepLabels[job.currentStep] || job.currentStep}</span>}
                    {progress?.download && <span>下载: {progress.download.doneFiles}/{progress.download.totalFiles}</span>}
                    {progress?.import && <span>导入: {progress.import.foundWorks} 作品</span>}
                    <span>{new Date(job.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detailJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailJob(null)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">任务详情</h2>
              <button onClick={() => setDetailJob(null)} className="text-zinc-400 hover:text-zinc-600 text-lg">✕</button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-zinc-500">来源:</span> {detailJob.providerId}</div>
              <div><span className="text-zinc-500">输入:</span> {detailJob.input}</div>
              <div><span className="text-zinc-500">编号:</span> {detailJob.normalizedSourceId || '-'}</div>
              <div><span className="text-zinc-500">状态:</span> {statusLabels[detailJob.status] || detailJob.status}</div>
              {detailJob.currentStep && <div><span className="text-zinc-500">步骤:</span> {stepLabels[detailJob.currentStep]}</div>}
              <div><span className="text-zinc-500">创建:</span> {new Date(detailJob.createdAt).toLocaleString()}</div>
              {detailJob.finishedAt && <div><span className="text-zinc-500">完成:</span> {new Date(detailJob.finishedAt).toLocaleString()}</div>}
            </div>

            {(() => {
              const p = parseProgress(detailJob.progressJson);
              if (!p) return null;
              return (
                <div className="mt-4 space-y-3">
                  {p.inspect && (
                    <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">探测结果</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{p.inspect.fileCount} 文件 · {(p.inspect.totalSize / 1e6).toFixed(0)} MB</p>
                    </div>
                  )}
                  {p.download && (
                    <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">下载结果</p>
                      <p className="text-xs text-green-600 dark:text-green-400">成功 {p.download.doneFiles}/{p.download.totalFiles} · {(p.download.bytesDownloaded / 1e6).toFixed(0)} MB</p>
                      {p.download.failedFiles > 0 && <p className="text-xs text-red-500">失败: {p.download.failedFiles}</p>}
                    </div>
                  )}
                  {p.import && (
                    <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-950">
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">导入结果</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">{p.import.foundWorks} 作品 · {p.import.foundTracks} 曲目</p>
                      {p.import.reviewCount > 0 && <p className="text-xs text-amber-500">待审查: {p.import.reviewCount}</p>}
                    </div>
                  )}
                </div>
              );
            })()}

            {(() => {
              const e = parseErrors(detailJob.errorJson);
              if (!e) return null;
              return (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-red-500">错误详情</summary>
                  <pre className="mt-1 max-h-48 overflow-auto rounded bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-400">{JSON.stringify(e, null, 2)}</pre>
                </details>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
