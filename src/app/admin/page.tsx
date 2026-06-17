import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="mt-2 text-zinc-500">Import management, metadata tools, and system configuration.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <a
          href="/admin/import"
          className="rounded-xl border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">Import Media</h2>
          <p className="mt-1 text-sm text-zinc-500">Scan local folders and import audio works.</p>
        </a>
        <a
          href="/admin/metadata"
          className="rounded-xl border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">Metadata Fetch</h2>
          <p className="mt-1 text-sm text-zinc-500">Fetch metadata by URL, code, or keyword.</p>
        </a>
        <a
          href="/admin/repositories"
          className="rounded-xl border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">Repositories</h2>
          <p className="mt-1 text-sm text-zinc-500">Configure local and remote storage.</p>
        </a>
        <a
          href="/admin/duplicates"
          className="rounded-xl border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">Duplicate Review</h2>
          <p className="mt-1 text-sm text-zinc-500">Review and merge duplicate works.</p>
        </a>
        <a
          href="/admin/jobs"
          className="rounded-xl border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">Job Status</h2>
          <p className="mt-1 text-sm text-zinc-500">Monitor import and metadata jobs.</p>
        </a>
        <a
          href="/admin/audit"
          className="rounded-xl border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">File Audit</h2>
          <p className="mt-1 text-sm text-zinc-500">Check for broken or missing files.</p>
        </a>
      </div>
    </div>
  );
}
