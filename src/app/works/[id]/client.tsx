'use client';

import { useState } from 'react';
import { usePlayer } from '@/components/player/player-provider';
import { SyncedSubtitleViewer } from '@/components/player/subtitle-viewer';
import { MetadataEditor } from '@/components/metadata-editor';
import Link from 'next/link';

interface TrackFile { id: string; filePath: string; fileSize: number | null; isAvailable: boolean; groupPath: string | null; groupLabel: string | null; sortKey: string | null; repository: { id: string; name: string; rootPath: string }; }
interface Track { id: string; trackNumber: number; title: string; durationSec: number | null; mimeType: string | null; bitrateKbps: number | null; trackFiles: TrackFile[]; }

export default function WorkClient({ work, isAdmin }: { work: any; isAdmin: boolean }) {
  const { play, addToQueue, currentIndex, playing, queue } = usePlayer();
  const [subViewer, setSubViewer] = useState<{ id: string; name: string } | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const tracks = (work.tracks as Track[]) || [];
  const subtitleFiles = work.trackSubtitles || [];

  const grouped = new Map<string, { label: string; tracks: Track[] }>();
  const ungrouped: Track[] = [];
  for (const t of tracks) {
    const tf = t.trackFiles[0];
    const label = tf?.groupLabel || '';
    if (label) { if (!grouped.has(label)) grouped.set(label, { label, tracks: [] }); grouped.get(label)!.tracks.push(t); }
    else ungrouped.push(t);
  }

  const totalDuration = tracks.reduce((s, t) => s + (t.durationSec || 0), 0);
  const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  const trackToItem = (t: Track) => ({ id: t.id, title: t.title, trackNumber: t.trackNumber, workTitle: work.displayTitle, workId: work.id, coverPath: work.coverPath, streamUrl: `/api/tracks/${t.id}/stream`, durationSec: t.durationSec });
  const handlePlayAll = (ts: Track[]) => { const items = ts.map(trackToItem); if (items.length > 0) play(items[0], items); };
  const toggleGroup = (key: string) => { const s = new Set(collapsedGroups); if (s.has(key)) s.delete(key); else s.add(key); setCollapsedGroups(s); };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24">
      <Link href="/works" className="text-sm text-zinc-500 hover:text-zinc-700">← 作品库</Link>

      <div className="mt-3 flex flex-col sm:flex-row gap-6">
        <div className="h-44 w-44 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          {work.coverPath ? <img src={`/api/covers/${work.id}`} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-zinc-400 text-5xl">♪</div>}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">{work.displayTitle}</h1>
          {work.workCode && <span className="inline-block mt-1 rounded bg-zinc-100 px-2 py-0.5 text-xs font-mono dark:bg-zinc-800">{work.workCode}</span>}
          {work.circle && <Link href={`/circles/${work.circle.id}`} className="ml-2 text-sm text-blue-600 hover:underline dark:text-blue-400">{work.circle.name}</Link>}
          <button onClick={() => setShowEditor(true)} className="ml-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">✏ 编辑</button>

          {work.workVAs?.length > 0 && <div className="mt-2 text-sm text-zinc-500">声优: {work.workVAs.map((v: any) => <Link key={v.voiceActor.id} href={`/voice-actors/${v.voiceActor.id}`} className="text-blue-600 hover:underline dark:text-blue-400 mr-1">{v.voiceActor.name}</Link>)}</div>}
          <div className="mt-1 flex flex-wrap gap-1">
            {work.workTags?.map((wt: any) => <Link key={wt.id} href={`/tags/${wt.tag.id}`} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700">{wt.tag.name}</Link>)}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span>{tracks.length} 首曲目</span><span>{fmt(totalDuration)}</span>
            {work.releaseDate && <span>{work.releaseDate}</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => handlePlayAll(tracks)} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">▶ 播放全部</button>
            {subtitleFiles.length > 0 && subtitleFiles.map((s: any) =>
              <button key={s.id} onClick={() => setSubViewer({ id: s.id, name: s.filePath?.split('/').pop() || '字幕' })} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">📝 {s.kind?.toUpperCase()}</button>
            )}
          </div>
        </div>
      </div>

      {work.description && <div className="mt-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{work.description}</p></div>}

      <div className="mt-8 space-y-4">
        {[...grouped.entries()].sort(([,a],[,b]) => (a.tracks[0]?.trackFiles[0]?.sortKey || '999').localeCompare(b.tracks[0]?.trackFiles[0]?.sortKey || '999')).map(([key, group]) => {
          const collapsed = collapsedGroups.has(key);
          const gDur = group.tracks.reduce((s, t) => s + (t.durationSec || 0), 0);
          return (
            <div key={key} className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <button onClick={() => toggleGroup(key)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <div className="flex items-center gap-2"><span className="text-sm">{collapsed ? '▶' : '▼'}</span><h3 className="font-semibold">{group.label}</h3><span className="text-xs text-zinc-500">{group.tracks.length} 首 · {fmt(gDur)}</span></div>
                <button onClick={(e) => { e.stopPropagation(); handlePlayAll(group.tracks); }} className="text-sm text-blue-600 hover:underline dark:text-blue-400">▶ 播放本组</button>
              </button>
              {!collapsed && (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {group.tracks.map((t) => {
                    const active = playing && currentIndex >= 0 && queue[currentIndex]?.id === t.id;
                    return (<div key={t.id} className={`flex items-center gap-2 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 ${active ? 'bg-blue-50 dark:bg-blue-950' : ''}`}><button onClick={() => handlePlayAll([t])} className="text-sm">{active && playing ? '⏸' : '▶'}</button><span className="w-7 text-center text-xs text-zinc-400">{String(t.trackNumber).padStart(2, '0')}</span><div className="flex-1 min-w-0"><p className={`text-sm truncate ${active ? 'font-medium text-blue-700 dark:text-blue-300' : ''}`}>{t.title}</p></div>{t.durationSec && <span className="text-xs text-zinc-400">{fmt(t.durationSec)}</span>}<button onClick={() => addToQueue(trackToItem(t))} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">+ 队列</button></div>);
                  })}
                </div>
              )}
            </div>
          );
        })}
        {ungrouped.length > 0 && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 font-semibold">曲目</div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {ungrouped.map((t) => {
                const active = playing && currentIndex >= 0 && queue[currentIndex]?.id === t.id;
                return (<div key={t.id} className={`flex items-center gap-2 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 ${active ? 'bg-blue-50 dark:bg-blue-950' : ''}`}><button onClick={() => handlePlayAll([t])} className="text-sm">{active && playing ? '⏸' : '▶'}</button><span className="w-7 text-center text-xs text-zinc-400">{String(t.trackNumber).padStart(2, '0')}</span><div className="flex-1 min-w-0"><p className={`text-sm truncate ${active ? 'font-medium text-blue-700 dark:text-blue-300' : ''}`}>{t.title}</p></div>{t.durationSec && <span className="text-xs text-zinc-400">{fmt(t.durationSec)}</span>}<button onClick={() => addToQueue(trackToItem(t))} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">+ 队列</button></div>);
              })}
            </div>
          </div>
        )}
      </div>

      {subViewer && <SyncedSubtitleViewer subId={subViewer.id} fileName={subViewer.name} allSubtitles={subtitleFiles} onClose={() => setSubViewer(null)} />}
      {showEditor && <MetadataEditor work={work} isAdmin={isAdmin} onSaved={() => setShowEditor(false)} />}
    </div>
  );
}
