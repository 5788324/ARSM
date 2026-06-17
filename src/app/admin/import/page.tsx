'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ImportResult {
  jobId: string;
  status: string;
  foundWorks: number;
  foundTracks: number;
  totalFiles: number;
  skippedFiles: number;
  errors: string[];
}

export default function ImportPage() {
  const router = useRouter();
  const [rootPath, setRootPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootPath: rootPath || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Import failed');
      } else {
        setResult(data);
        // Refresh the page data after import
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">Import Media</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Scan a local folder and import audio works into your library.
      </p>

      {/* Input */}
      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="rootPath" className="block text-sm font-medium">
            Folder Path
          </label>
          <input
            id="rootPath"
            type="text"
            value={rootPath}
            onChange={(e) => setRootPath(e.target.value)}
            placeholder="e.g. G:/Media/ASMR"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Leave empty to use the default library root from .env
          </p>
        </div>

        <button
          onClick={handleImport}
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? 'Scanning & Importing...' : 'Start Import'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
          <h2 className="font-semibold text-green-800 dark:text-green-300">Import Complete</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-zinc-500">Works found:</span>{' '}
              <span className="font-semibold">{result.foundWorks}</span>
            </div>
            <div>
              <span className="text-zinc-500">Tracks imported:</span>{' '}
              <span className="font-semibold">{result.foundTracks}</span>
            </div>
            <div>
              <span className="text-zinc-500">Files scanned:</span>{' '}
              <span className="font-semibold">{result.totalFiles}</span>
            </div>
            <div>
              <span className="text-zinc-500">Skipped:</span>{' '}
              <span className="font-semibold">{result.skippedFiles}</span>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Warnings ({result.errors.length})
              </p>
              <ul className="mt-1 list-inside list-disc text-xs text-amber-600 dark:text-amber-500">
                {result.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {result.errors.length > 10 && (
                  <li>...and {result.errors.length - 10} more</li>
                )}
              </ul>
            </div>
          )}

          <button
            onClick={() => router.push('/works')}
            className="mt-4 text-sm font-medium text-green-700 hover:underline dark:text-green-400"
          >
            View Library →
          </button>
        </div>
      )}
    </div>
  );
}
