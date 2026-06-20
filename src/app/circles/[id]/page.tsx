import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function CirclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const circle = await prisma.circle.findUnique({ where: { id }, include: { works: { orderBy: { updatedAt: 'desc' }, include: { _count: { select: { tracks: true } } } } } });
  if (!circle) return <div className="mx-auto max-w-4xl px-4 py-8"><p>社团未找到</p></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/works" className="text-sm text-zinc-500 hover:text-zinc-700">← 作品库</Link>
      <h1 className="mt-2 text-2xl font-bold">{circle.name}</h1>
      <p className="text-sm text-zinc-500">{circle.works.length} 个作品</p>
      {circle.works.length === 0 ? (
        <p className="mt-4 text-zinc-400">暂无作品</p>
      ) : (
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {circle.works.map((w) => (
          <Link key={w.id} href={`/works/${w.id}`} className="rounded-xl border border-zinc-200 p-4 hover:shadow dark:border-zinc-800">
            <p className="font-medium text-sm truncate">{w.displayTitle}</p>
            <p className="text-xs text-zinc-500">{w._count.tracks} 首</p>
          </Link>
        ))}
      </div>
      )}
    </div>
  );
}
