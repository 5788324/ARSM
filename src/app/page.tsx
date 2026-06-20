import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const recent = await prisma.listeningHistory.findMany({
    where: { userId: session.user.id },
    include: { work: true },
    orderBy: { listenedAt: 'desc' },
    take: 6,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <section className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">你的私人音频图书馆</h1>
        <p className="text-gray-600">
          管理本地 ASMR 作品，继续收听上次进度，并维护自己的私有收藏。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/works" className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800">
            浏览作品库
          </Link>
          <Link href="/favorites" className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
            查看收藏
          </Link>
          {(session.user as { isAdmin?: boolean }).isAdmin && (
            <Link href="/admin" className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">
              打开管理后台
            </Link>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">最近收听</h2>
          <Link href="/works" className="text-sm text-gray-600 hover:text-black">
            查看全部
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-gray-500 shadow-sm">
            暂无收听记录，先去作品库挑一个作品开始播放。
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((item) => (
              <Link
                key={item.id}
                href={`/works/${item.workId}`}
                className="rounded-2xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
              >
                <div className="mb-2 text-sm text-gray-500">
                  {new Date(item.listenedAt).toLocaleString('zh-CN')}
                </div>
                <div className="line-clamp-2 font-medium">{item.work.displayTitle}</div>
                <div className="mt-2 text-sm text-gray-600">
                  已听到 {Math.floor(item.positionSec / 60)} 分 {item.positionSec % 60} 秒
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

