import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function FavoritesPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user!.id! },
    orderBy: { createdAt: 'desc' },
    include: {
      work: {
        include: {
          circle: true,
          _count: { select: { tracks: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Favorites</h1>
        <Link href="/works" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Library
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg text-zinc-500">No favorites yet.</p>
          <Link
            href="/works"
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Browse Library
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((fav) => (
            <Link
              key={fav.id}
              href={`/works/${fav.work.id}`}
              className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="aspect-square bg-zinc-100 dark:bg-zinc-800">
                {fav.work.coverPath ? (
                  <img
                    src={fav.work.coverPath}
                    alt={fav.work.displayTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-400">
                    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium leading-tight group-hover:text-zinc-600">
                  {fav.work.displayTitle}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  {fav.work.circle && <span>{fav.work.circle.name}</span>}
                  {fav.work.workCode && (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">
                      {fav.work.workCode}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-zinc-400">{fav.work._count.tracks} tracks</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
