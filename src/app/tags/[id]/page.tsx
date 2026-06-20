import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function TagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tag = await prisma.tag.findUnique({ where: { id }, include: { workTags: { include: { work: { include: { _count: { select: { tracks: true } } } } }, orderBy: { work: { updatedAt: 'desc' } } } } });
  if (!tag) return <div className="mx-auto max-w-4xl px-4 py-8"><p>标签未找到</p></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/works" className="text-sm text-zinc-500 hover:text-zinc-700">← 作品库</Link>
      <h1 className="mt-2 text-2xl font-bold">#{tag.name}</h1>
      <p className="text-sm text-zinc-500">{tag.workTags.length} 个作品</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tag.workTags.map((wt) => (
          <Link key={wt.work.id} href={`/works/${wt.work.id}`} className="rounded-xl border border-zinc-200 p-4 hover:shadow dark:border-zinc-800">
            <p className="font-medium text-sm truncate">{wt.work.displayTitle}</p>
            <p className="text-xs text-zinc-500">{wt.work._count.tracks} 首</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
