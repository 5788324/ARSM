'use client';

import { usePlayer } from '@/components/player/player-provider';
import Link from 'next/link';

interface TrackFile {
  id: string; filePath: string; fileSize: number | null; isAvailable: boolean;
  groupPath: string | null; groupLabel: string | null; sortKey: string | null;
  repository: { id: string; name: string; rootPath: string };
}
interface Track {
  id: string; trackNumber: number; title: string; durationSec: number | null;
  mimeType: string | null; bitrateKbps: number | null;
  trackFiles: TrackFile[];
}

export default function WorkClient({ work }: { work: any }) {
  const { play, currentIndex, playing, queue } = usePlayer();
  const tracks = (work.tracks as Track[]) || [];

  // Group tracks by groupLabel
  const grouped = new Map<string, { label: string; tracks: Track[] }>();
  const ungrouped: Track[] = [];

  for (const t of tracks) {
    const tf = t.trackFiles[0];
    const label = tf?.groupLabel || '';
    if (label) {
      if (!grouped.has(label)) grouped.set(label, { label, tracks: [] });
      grouped.get(label)!.tracks.push(t);
    } else {
      ungrouped.push(t);
    }
  }

  const totalDuration = tracks.reduce((s, t) => s + (t.durationSec || 0), 0);
  const formatDur = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  const handlePlayAll = (ts: Track[]) => {
    const items = ts.map((t) => ({
      id: t.id, title: t.title, trackNumber: t.trackNumber,
      workTitle: work.displayTitle as string, workId: work.id as string,
      coverPath: work.coverPath as string | null,
      streamUrl: `/api/tracks/${t.id}/stream`,
      durationSec: t.durationSec,
    }));
    if (items.length > 0) play(items[0], items);
  };

  const isPlaying = (trackId: string) =>
    playing && currentIndex >= 0 && queue[currentIndex]?.id === trackId;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24">
      <div className="mb-6"><Link href="/works" className="text-sm text-zinc-500 hover:text-zinc-700">← 作品库</Link></div>

      <div className="flex gap-6">
        <div className="h-48 w-48 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          {work.coverPath ? (
            <img src={`/api/covers/${work.id}`} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400 text-4xl">♪</div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{work.displayTitle as string}</h1>
          {work.circle && <p className="mt-1 text-sm text-zinc-500">{work.circle.name}</p>}
          {work.workVAs && work.workVAs.length > 0 && (
            <p className="mt-1 text-sm text-zinc-500">声优：{work.workVAs.map((v: any) => v.voiceActor.name).join(', ')}</p>
          )}
          {work.workTags && work.workTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {work.workTags.map((wt: any) => (
                <span key={wt.id} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">{wt.tag.name}</span>
              ))}
            </div>
          )}
          <p className="mt-2 text-sm text-zinc-400">{tracks.length} 首曲目 · {formatDur(totalDuration)}</p>
          <button onClick={() => handlePlayAll(tracks)} className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900">▶ 播放全部</button>
        </div>
      </div>

      {work.description && (
        <div className="mt-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{work.description as string}</p>
        </div>
      )}

      {/* Grouped tracks */}
      <div className="mt-8 space-y-6">
        {[...grouped.entries()].sort(([,a],[,b]) => (a.tracks[0]?.trackFiles[0]?.sortKey || '999').localeCompare(b.tracks[0]?.trackFiles[0]?.sortKey || '999')).map(([key, group]) => (
          <div key={key}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{group.label}</h3>
              <button onClick={() => handlePlayAll(group.tracks)} className="text-sm text-zinc-500 hover:text-zinc-700">▶ 播放本组</button>
            </div>
            <div className="mt-2 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {group.tracks.map((t) => {
                const active = isPlaying(t.id);
                return (
                  <div key={t.id} className={`flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 ${active ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
                    <button onClick={() => handlePlayAll([t])} className="flex-shrink-0 text-lg">{active && playing ? '⏸' : '▶'}</button>
                    <span className="w-8 text-center text-xs text-zinc-400">{String(t.trackNumber).padStart(2, '0')}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${active ? 'font-medium text-blue-700 dark:text-blue-300' : ''}`}>{t.title}</p>
                      {t.durationSec && <p className="text-xs text-zinc-500">{formatDur(t.durationSec)}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {ungrouped.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold">曲目</h3>
            <div className="mt-2 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {ungrouped.map((t) => {
                const active = isPlaying(t.id);
                return (
                  <div key={t.id} className={`flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 ${active ? 'bg-blue-50 dark:bg-blue-950' : ''}`}>
                    <button onClick={() => handlePlayAll([t])} className="flex-shrink-0 text-lg">{active && playing ? '⏸' : '▶'}</button>
                    <span className="w-8 text-center text-xs text-zinc-400">{String(t.trackNumber).padStart(2, '0')}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${active ? 'font-medium text-blue-700 dark:text-blue-300' : ''}`}>{t.title}</p>
                      {t.durationSec && <p className="text-xs text-zinc-500">{formatDur(t.durationSec)}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subtitle / Text files */}
        {work.trackSubtitles && work.trackSubtitles.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold">字幕 / 台本</h2>
            <div className="mt-2 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {work.trackSubtitles.map((sub: any) => (
                <div key={sub.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-mono dark:bg-zinc-800">{sub.kind?.toUpperCase()}</span>
                  <span className="flex-1 text-sm truncate">{sub.filePath?.split('/').pop()}</span>
                  {sub.label && <span className="text-xs text-zinc-500">{sub.label}</span>}
                  {sub.language && <span className="text-xs text-zinc-400">{sub.language}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
