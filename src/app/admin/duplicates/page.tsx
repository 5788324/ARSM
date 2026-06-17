'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    fetch('/api/admin/duplicates')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-zinc-500">Scanning for duplicates...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Duplicate Review</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Works that may be duplicates — same code or very similar titles.
      </p>

      {!data || data.total === 0 ? (
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950">
          <p className="text-green-700 dark:text-green-300">No duplicates found!</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {data.groups.map((group, gi) => (
            <div
              key={gi}
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950"
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                  {group.reason === 'duplicate_code' ? 'Same Code' : 'Similar Title'}
                </span>
                {group.code && (
                  <code className="rounded bg-white px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                    {group.code}
                  </code>
                )}
                {group.titlePrefix && (
                  <span className="text-xs text-zinc-500">
                    &quot;{group.titlePrefix}...&quot;
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-2">
                {group.works.map((work) => (
                  <Link
                    key={work.id}
                    href={`/works/${work.id}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{work.displayTitle}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                        {work.circle && <span>{work.circle.name}</span>}
                        {work.workCode && (
                          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
                            {work.workCode}
                          </code>
                        )}
                        <span>·</span>
                        <span>{work._count.tracks} tracks</span>
                        <span>·</span>
                        <span>{new Date(work.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className="ml-4 text-xs text-zinc-400">View →</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
