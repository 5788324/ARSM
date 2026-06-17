'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MetadataResult {
  jobId: string;
  status: string;
  metadata: {
    displayTitle: string;
    originalTitle?: string;
    workCode?: string;
    circleName?: string;
    description?: string;
    coverUrl?: string;
    releaseDate?: string;
    tags: string[];
    voiceActors: string[];
    tracks: { trackNumber: number; title: string; durationSec?: number }[];
    sourceSite: string;
    sourceUrl: string;
  };
}

export default function MetadataPage() {
  const router = useRouter();
  const [provider, setProvider] = useState('dlsite');
  const [queryType, setQueryType] = useState('code');
  const [queryValue, setQueryValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MetadataResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/metadata/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, queryType, queryValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Fetch failed');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">获取元数据</h1>
      <p className="mt-1 text-sm text-zinc-500">
        从外部来源获取作品元数据（URL 或 RJ 编号）。
      </p>

      <div className="mt-6 space-y-4">
        {/* Provider */}
        <div>
          <label className="block text-sm font-medium">来源</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="dlsite">DLsite</option>
            <option value="asmrone">asmr.one</option>
          </select>
        </div>

        {/* Query type */}
        <div>
          <label className="block text-sm font-medium">查询方式</label>
          <select
            value={queryType}
            onChange={(e) => setQueryType(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="url">URL</option>
            <option value="code">作品编号 (如 RJ123456)</option>
          </select>
        </div>

        {/* Value */}
        <div>
          <label className="block text-sm font-medium">
            {queryType === 'url'
              ? 'URL'
              : queryType === 'code'
                ? 'Work Code'
                : '搜索标题'}
          </label>
          <input
            type="text"
            value={queryValue}
            onChange={(e) => setQueryValue(e.target.value)}
            placeholder={
              queryType === 'url'
                ? 'https://www.dlsite.com/...'
                : queryType === 'code'
                  ? 'RJ123456'
                  : '作品标题...'
            }
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>

        <button
          onClick={handleFetch}
          disabled={loading || !queryValue}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? '正在获取...' : '获取元数据'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Result Preview */}
      {result?.metadata && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold">Preview</h2>

          {result.metadata.coverUrl && (
            <img
              src={result.metadata.coverUrl}
              alt={result.metadata.displayTitle}
              className="mt-3 h-40 w-40 rounded-lg object-cover"
            />
          )}

          <div className="mt-3 space-y-1 text-sm">
            <p>
              <span className="text-zinc-500">Title:</span>{' '}
              {result.metadata.displayTitle}
            </p>
            {result.metadata.originalTitle && (
              <p>
                <span className="text-zinc-500">原标题：</span>{' '}
                {result.metadata.originalTitle}
              </p>
            )}
            {result.metadata.workCode && (
              <p>
                <span className="text-zinc-500">编号：</span>{' '}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
                  {result.metadata.workCode}
                </code>
              </p>
            )}
            {result.metadata.circleName && (
              <p>
                <span className="text-zinc-500">社团：</span>{' '}
                {result.metadata.circleName}
              </p>
            )}
            {result.metadata.releaseDate && (
              <p>
                <span className="text-zinc-500">发布日期：</span>{' '}
                {result.metadata.releaseDate}
              </p>
            )}
          </div>

          {result.metadata.tags.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-zinc-500">标签：</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {result.metadata.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.metadata.tracks.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-zinc-500">
                曲目 ({result.metadata.tracks.length}):
              </p>
              <ol className="mt-1 list-inside list-decimal text-xs text-zinc-600 dark:text-zinc-400">
                {result.metadata.tracks.map((t) => (
                  <li key={t.trackNumber}>
                    {t.title}
                    {t.durationSec && ` (${Math.floor(t.durationSec / 60)}:${String(t.durationSec % 60).padStart(2, '0')})`}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.metadata.description && (
            <div className="mt-3">
              <p className="text-xs text-zinc-500">简介：</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-6">
                {result.metadata.description}
              </p>
            </div>
          )}

          <p className="mt-3 text-xs text-zinc-400">
            来源：{' '}
            <a
              href={result.metadata.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {result.metadata.sourceSite}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
