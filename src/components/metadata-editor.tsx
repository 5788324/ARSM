'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function MetadataEditor({ work, onSaved }: { work: any; onSaved: () => void }) {
  const [title, setTitle] = useState(work.displayTitle || '');
  const [origTitle, setOrigTitle] = useState(work.originalTitle || '');
  const [release, setRelease] = useState(work.releaseDate || '');
  const [rating, setRating] = useState(work.ratings?.[0]?.rating || 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const save = async (refetch = false) => {
    setSaving(true); setError('');
    // Always save rating first
    const rRes = await fetch(`/api/ratings?workId=${work.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating }),
    });
    if (!rRes.ok) { setError('评分保存失败'); setSaving(false); return; }

    // Only call admin API if admin fields actually changed
    const adminChanged = title !== (work.displayTitle || '') || origTitle !== (work.originalTitle || '') || release !== (work.releaseDate || '');
    if (!adminChanged && !refetch) {
      setSaving(false);
      router.refresh();
      onSaved();
      return;
    }

    const res = await fetch(`/api/metadata/edit?workId=${work.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayTitle: title, originalTitle: origTitle, releaseDate: release, refetch }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(`评分已保存，但：${data.error || '元数据保存失败'}`);
      setSaving(false);
      return;
    }
    setSaving(false);
    router.refresh();
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onSaved}>
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">编辑元数据</h3>
        {error && <div className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</div>}
        <div className="space-y-3">
          <div><label className="text-xs text-zinc-500">个人评分</label>
            <div className="mt-1 flex gap-1">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setRating(s)} className={`text-xl ${s <= rating ? 'text-yellow-500' : 'text-zinc-300 dark:text-zinc-600'}`}>{s <= rating ? '★' : '☆'}</button>)}
              {rating > 0 && <button onClick={() => setRating(0)} className="ml-2 text-xs text-zinc-400 hover:text-red-500">清除</button>}
            </div>
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-800 my-3" />
          <div><label className="text-xs text-zinc-500">标题（管理员）</label><input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800" /></div>
          <div><label className="text-xs text-zinc-500">原标题（管理员）</label><input value={origTitle} onChange={e => setOrigTitle(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800" /></div>
          <div><label className="text-xs text-zinc-500">发售日（管理员）</label><input value={release} onChange={e => setRelease(e.target.value)} className="mt-1 block w-full rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800" /></div>
        </div>
        <p className="mt-3 text-xs text-zinc-400">管理员字段仅管理员可写，保存时如无权限会提示</p>
        <div className="mt-5 flex gap-2">
          <button onClick={() => save(true)} disabled={saving} className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">{saving ? '保存中...' : '重新抓取 + 保存'}</button>
          <button onClick={() => save(false)} disabled={saving} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">{saving ? '...' : '保存'}</button>
        </div>
      </div>
    </div>
  );
}
