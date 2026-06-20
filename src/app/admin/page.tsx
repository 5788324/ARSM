import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="text-2xl font-bold">管理面板</h1>
      <p className="mt-2 text-zinc-500">导入管理、元数据工具与系统配置。</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <a
          href="/admin/import"
          className="rounded-xl border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">导入媒体</h2>
          <p className="mt-1 text-sm text-zinc-500">扫描本地文件夹并导入音频作品。</p>
        </a>
        <a
          href="/admin/metadata"
          className="rounded-xl border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">元数据抓取</h2>
          <p className="mt-1 text-sm text-zinc-500">通过 URL、编号或关键词获取元数据。</p>
        </a>
        <a
          href="/admin/repositories"
          className="rounded-xl border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">仓库管理</h2>
          <p className="mt-1 text-sm text-zinc-500">配置本地和远程存储后端。</p>
        </a>
        <a
          href="/admin/duplicates"
          className="rounded-xl border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">重复审查</h2>
          <p className="mt-1 text-sm text-zinc-500">审查并合并重复作品。</p>
        </a>
        <a
          href="/admin/acquisition"
          className="rounded-xl border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">采集任务</h2>
          <p className="mt-1 text-sm text-zinc-500">从 asmr.one 等来源采集作品。</p>
        </a>
        <a
          href="/admin/jobs"
          className="rounded-xl border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">任务状态</h2>
          <p className="mt-1 text-sm text-zinc-500">监控导入和元数据任务。</p>
        </a>
        <a
          href="/admin/audit"
          className="rounded-xl border border-zinc-200 p-6 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-semibold">文件审计</h2>
          <p className="mt-1 text-sm text-zinc-500">检查损坏或缺失的文件。</p>
        </a>
      </div>
    </div>
  );
}
