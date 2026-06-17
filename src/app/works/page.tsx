import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function WorksPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const works = await prisma.work.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 50,
    include: {
      circle: true,
      _count: { select: { tracks: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">作品库</h1>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="搜索作品..."
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
      </div>

      {works.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg text-zinc-500">还没有导入任何作品。</p>
          <Link
            href="/admin/import"
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            导入你的第一个作品
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {works.map((work) => (
            <Link
              key={work.id}
              href={`/works/${work.id}`}
              className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Cover */}
              <div className="aspect-square bg-zinc-100 dark:bg-zinc-800">
                {work.coverPath ? (
                  <img
                    src={`/api/covers/${work.id}`}
                    alt={work.displayTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-400">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-medium leading-tight group-hover:text-zinc-600">
                  {work.displayTitle}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  {work.circle && <span>{work.circle.name}</span>}
                  {work.workCode && (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">
                      {work.workCode}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  {work._count.tracks} 首曲目
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
