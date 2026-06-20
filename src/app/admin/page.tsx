import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold">管理面板</h1>
      <p className="mt-2 text-zinc-500">导入管理、采集任务与系统配置。</p>

      {/* Primary action — highlighted */}
      <div className="mt-6">
        <a
          href="/admin/acquisition"
          className="block rounded-xl border-2 border-green-300 bg-green-50 p-6 hover:border-green-500 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:hover:border-green-600 transition-colors"
        >
          <h2 className="text-lg font-bold text-green-800 dark:text-green-200">📥 采集任务</h2>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            输入 RJ 编号，从 asmr.one 一键下载并导入作品。
          </p>
        </a>
      </div>

      {/* Secondary actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a
          href="/admin/import"
          className="rounded-xl border border-zinc-200 p-5 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">📁 导入媒体</h2>
          <p className="mt-1 text-sm text-zinc-500">扫描本地文件夹导入已有音频。</p>
        </a>
        <a
          href="/admin/jobs"
          className="rounded-xl border border-zinc-200 p-5 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">📋 任务状态</h2>
          <p className="mt-1 text-sm text-zinc-500">查看导入和采集任务进度。</p>
        </a>
        <a
          href="/admin/metadata"
          className="rounded-xl border border-zinc-200 p-5 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">🔍 元数据</h2>
          <p className="mt-1 text-sm text-zinc-500">通过编号获取作品元数据。</p>
        </a>
        <a
          href="/admin/repositories"
          className="rounded-xl border border-zinc-200 p-5 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">🗄️ 仓库管理</h2>
          <p className="mt-1 text-sm text-zinc-500">配置存储后端。</p>
        </a>
      </div>
    </div>
  );
}
