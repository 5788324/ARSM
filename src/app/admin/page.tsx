import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { listProviders } from '@/lib/acquisition/registry';

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const [workCount, trackCount, circleCount] = await Promise.all([
    prisma.work.count(),
    prisma.track.count(),
    prisma.circle.count(),
  ]);

  const providers = listProviders();
  const canDownload = providers.filter(p => p.canDownload !== false).length;
  const inspectOnly = providers.filter(p => p.canDownload === false).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold">管理面板</h1>
      <p className="mt-2 text-zinc-500">导入管理、采集任务与系统配置。</p>

      {/* System info */}
      <div className="mt-6 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">系统信息</h2>
        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <div><span className="text-zinc-400">版本</span><p className="font-medium">v1.0 (Phase 10)</p></div>
          <div><span className="text-zinc-400">数据库</span><p className="font-medium font-mono text-xs">SQLite (arsm.db)</p></div>
          <div><span className="text-zinc-400">来源</span><p className="font-medium">{canDownload} 可下载{inspectOnly > 0 ? ` + ${inspectOnly} 元数据` : ''}</p></div>
          <div><span className="text-zinc-400">作品</span><p className="font-medium">{workCount}</p></div>
          <div><span className="text-zinc-400">曲目</span><p className="font-medium">{trackCount}</p></div>
          <div><span className="text-zinc-400">社团</span><p className="font-medium">{circleCount}</p></div>
        </div>
      </div>

      {/* Primary action — highlighted */}
      <div className="mt-6">
        <a href="/admin/acquisition" className="block rounded-xl border-2 border-green-300 bg-green-50 p-6 hover:border-green-500 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:hover:border-green-600 transition-colors">
          <h2 className="text-lg font-bold text-green-800 dark:text-green-200">📥 采集任务</h2>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">输入 RJ 编号，从 asmr.one 一键下载并导入作品。</p>
        </a>
      </div>

      {/* Secondary actions */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a href="/admin/import" className="rounded-xl border border-zinc-200 p-5 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
          <h2 className="font-semibold">📁 导入媒体</h2><p className="mt-1 text-sm text-zinc-500">扫描本地文件夹导入已有音频。</p>
        </a>
        <a href="/admin/jobs" className="rounded-xl border border-zinc-200 p-5 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
          <h2 className="font-semibold">📋 任务状态</h2><p className="mt-1 text-sm text-zinc-500">查看导入和采集任务进度。</p>
        </a>
        <a href="/admin/metadata" className="rounded-xl border border-zinc-200 p-5 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
          <h2 className="font-semibold">🔍 元数据</h2><p className="mt-1 text-sm text-zinc-500">通过编号获取作品元数据。</p>
        </a>
        <a href="/admin/repositories" className="rounded-xl border border-zinc-200 p-5 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
          <h2 className="font-semibold">🗄️ 仓库管理</h2><p className="mt-1 text-sm text-zinc-500">配置存储后端。</p>
        </a>
      </div>
    </div>
  );
}
