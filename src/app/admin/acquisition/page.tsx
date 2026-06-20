'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface InspectResult {
  sourceId: string;
  workId: string;
  title: string;
  release: string;
  hasSubtitle: boolean;
  fileCount: number;
  totalSize: number;
  files: { path: string; type: string; size: number; mediaDownloadUrl: string; mediaStreamUrl: string }[];
}

function formatSize(bytes: number): string {
  if (bytes > 1e9) return `${(bytes/1e9).toFixed(1)} GB`;
  if (bytes > 1e6) return `${(bytes/1e6).toFixed(1)} MB`;
  if (bytes > 1e3) return `${(bytes/1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function AcquisitionPage() {
  const [input, setInput] = useState('RJ01538000');
  const [targetDir, setTargetDir] = useState('C:/Users/YANG/Music/arsm.one');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'inspect' | 'download'>('inspect');
  const [result, setResult] = useState<InspectResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadResult, setDownloadResult] = useState<{ files: { path: string; status: string; size: number; error?: string }[]; errors: string[] } | null>(null);

  const typeStats = (files: { type: string }[]) => {
    const stats: Record<string, number> = {};
    for (const f of files) stats[f.type] = (stats[f.type] || 0) + 1;
    return stats;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setDownloadResult(null);

    try {
      const res = await fetch('/api/acquisition/asmrone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: mode, input, targetDir: mode === 'download' ? targetDir : undefined }),
      });

      const resp = await res.json();
      if (!resp.ok) throw new Error(resp.error || '请求失败');

      if (mode === 'inspect') {
        setResult(resp.data);
      } else {
        setDownloadResult(resp.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">asmr.one 获取</h1>
      <p className="mt-1 text-sm text-zinc-500">通过 API 探测或下载作品。</p>

      <div className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <label className="block text-sm font-medium">来源</label>
          <input type="text" value="asmr.one (API)" disabled
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800" />
        </div>
        <div>
          <label className="block text-sm font-medium">RJ 编号</label>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="RJ01538000"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
        </div>
        <div>
          <label className="block text-sm font-medium">模式</label>
          <select value={mode} onChange={(e) => setMode(e.target.value as 'inspect' | 'download')}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
            <option value="inspect">仅探测（查看文件树）</option>
            <option value="download">下载到本地</option>
          </select>
        </div>
        {mode === 'download' && (
          <div>
            <label className="block text-sm font-medium">目标目录</label>
            <input type="text" value={targetDir} onChange={(e) => setTargetDir(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
          </div>
        )}
        <button onClick={handleSubmit} disabled={loading || !input}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
          {loading ? '处理中...' : mode === 'inspect' ? '探测' : '开始下载'}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">{error}</div>
      )}

      {/* Inspect result */}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">{result.title}</h2>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
              <span>编号：{result.sourceId}</span>
              <span>·</span>
              <span>发布日期：{result.release}</span>
              <span>·</span>
              <span>字幕：{result.hasSubtitle ? '有' : '无'}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                <p className="text-2xl font-bold">{result.fileCount}</p>
                <p className="text-xs text-zinc-500">文件数</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                <p className="text-2xl font-bold">{formatSize(result.totalSize)}</p>
                <p className="text-xs text-zinc-500">总大小</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                <p className="text-sm font-bold">{Object.entries(typeStats(result.files)).map(([t, c]) => `${t}:${c}`).join(' ')}</p>
                <p className="text-xs text-zinc-500">类型分布</p>
              </div>
            </div>
          </div>

          <details className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <summary className="cursor-pointer font-medium">文件列表（{result.fileCount} 个）</summary>
            <div className="mt-3 max-h-96 overflow-auto">
              {result.files.map((f, i) => (
                <div key={i} className="flex items-center justify-between border-b border-zinc-100 py-1.5 text-xs dark:border-zinc-800">
                  <span className="truncate mr-2">{f.path}</span>
                  <span className="flex-shrink-0 text-zinc-400">{formatSize(f.size)}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Download result */}
      {downloadResult && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold">下载结果</h2>
          <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{downloadResult.files.filter((f) => f.status === 'done').length}</p>
              <p className="text-xs text-green-600 dark:text-green-400">成功</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950">
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">{downloadResult.files.filter((f) => f.status === 'failed').length}</p>
              <p className="text-xs text-red-600 dark:text-red-400">失败</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
              <p className="text-2xl font-bold">{downloadResult.files.length}</p>
              <p className="text-xs text-zinc-500">总计</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <ImportButton targetDir={`${targetDir}/${input.toUpperCase()}`} />
          </div>

          {downloadResult.errors.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-red-500">错误（{downloadResult.errors.length}）</summary>
              <ul className="mt-1 list-inside list-disc text-xs text-red-400">
                {downloadResult.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function ImportButton({ targetDir }: { targetDir: string }) {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const handleImport = async () => {
    setImporting(true);
    setImportMsg('');
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootPath: targetDir }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '导入失败');
      setImportMsg(`✅ 导入完成：${data.foundWorks} 个作品，${data.foundTracks} 首曲目`);
      router.refresh();
    } catch (err) {
      setImportMsg(`❌ ${err instanceof Error ? err.message : '导入失败'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <button onClick={handleImport} disabled={importing}
        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50">
        {importing ? '导入中...' : '📦 导入到 ARSM'}
      </button>
      {importMsg && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{importMsg}</p>}
    </div>
  );
}
