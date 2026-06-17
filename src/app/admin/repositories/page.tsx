'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Repository {
  id: string;
  name: string;
  type: string;
  rootPath: string;
  config: string | null;
  isEnabled: boolean;
  createdAt: string;
  healthy?: boolean;
}

export default function RepositoriesPage() {
  const router = useRouter();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('local');
  const [formPath, setFormPath] = useState('');
  const [formToken, setFormToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRepos = () => {
    setLoading(true);
    fetch('/api/repositories?health=true')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRepos(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleCreate = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const config = formToken ? { token: formToken } : undefined;
      const res = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          type: formType,
          rootPath: formPath,
          config,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create');
      }

      setShowForm(false);
      setFormName('');
      setFormPath('');
      setFormToken('');
      fetchRepos();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this repository? This cannot be undone.')) return;

    try {
      const res = await fetch('/api/repositories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }

      fetchRepos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleToggle = async (repo: Repository) => {
    try {
      await fetch('/api/repositories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: repo.id, isEnabled: !repo.isEnabled }),
      });
      fetchRepos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">仓库管理</h1>
          <p className="mt-1 text-sm text-zinc-500">
            配置本地和远程存储后端。
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {showForm ? '取消' : '添加仓库'}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold">新建仓库</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="我的图书馆"
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="local">Local Filesystem</option>
                <option value="openlist">OpenList</option>
                <option value="webdav">WebDAV</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">
                {formType === 'local' ? '根路径' : '基础 URL'}
              </label>
              <input
                type="text"
                value={formPath}
                onChange={(e) => setFormPath(e.target.value)}
                placeholder={
                  formType === 'local'
                    ? 'G:/Media/ASMR'
                    : 'http://openlist.local:8080'
                }
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
            {formType !== 'local' && (
              <div>
                <label className="block text-sm font-medium">
                  认证令牌（可选）
                </label>
                <input
                  type="password"
                  value={formToken}
                  onChange={(e) => setFormToken(e.target.value)}
                  placeholder="Bearer 令牌或密码"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
            )}
            <button
              onClick={handleCreate}
              disabled={submitting || !formName || !formPath}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {submitting ? '创建中...' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Repository List */}
      {loading ? (
        <p className="mt-6 text-zinc-500">加载中...</p>
      ) : (
        <div className="mt-6 space-y-3">
          {repos.length === 0 ? (
            <p className="text-sm text-zinc-500">
              还没有配置仓库。添加一个以开始导入。
            </p>
          ) : (
            repos.map((repo) => (
              <div
                key={repo.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{repo.name}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-mono ${
                        repo.type === 'local'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : repo.type === 'openlist'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                      }`}
                    >
                      {repo.type}
                    </span>
                    {repo.healthy !== undefined && (
                      <span
                        className={`h-2 w-2 rounded-full ${
                          repo.healthy ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        title={repo.healthy ? 'Healthy' : 'Unreachable'}
                      />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 font-mono">{repo.rootPath}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Added {new Date(repo.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(repo)}
                    className={`rounded px-3 py-1 text-xs ${
                      repo.isEnabled
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                    }`}
                  >
                    {repo.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => handleDelete(repo.id)}
                    className="rounded px-3 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
