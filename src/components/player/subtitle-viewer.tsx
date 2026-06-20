'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/components/player/player-provider';
import type { SubtitleCue } from '@/lib/subtitles/parser';

interface SyncedSubtitleProps {
  subId: string;
  fileName: string;
  allSubtitles?: { id: string; filePath: string }[];
  onClose: () => void;
}

export function SyncedSubtitleViewer({ subId, fileName, allSubtitles, onClose }: SyncedSubtitleProps) {
  const [cues, setCues] = useState<SubtitleCue[] | null>(null);
  const [content, setContent] = useState<string>('');
  const [hasTiming, setHasTiming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSubId, setActiveSubId] = useState(subId);
  const [activeIdx, setActiveIdx] = useState(-1);
  const cuesRef = useRef<HTMLDivElement>(null);
  const { currentTime, seek } = usePlayer();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/subtitles?id=${activeSubId}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) { setCues(data.data.cues); setContent(data.data.content); setHasTiming(data.data.hasTiming); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeSubId]);

  // Find active cue by scanning cue time ranges
  useEffect(() => {
    if (!cues || !hasTiming) return;
    const idx = cues.findIndex(c => c.start <= currentTime && c.end >= currentTime);
    if (idx !== activeIdx) setActiveIdx(idx);
    if (idx >= 0 && cuesRef.current) {
      const el = cuesRef.current.children[idx] as HTMLElement;
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [currentTime, cues, hasTiming, activeIdx]);

  if (loading) return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}><div className="rounded-xl bg-white p-6 dark:bg-zinc-900">加载中...</div></div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="mx-4 max-h-[85vh] w-full max-w-3xl flex flex-col rounded-xl bg-white dark:bg-zinc-900" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-semibold">{fileName}</h3>
            {hasTiming && <span className="text-xs text-blue-500">⏱ 字幕跟播</span>}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-lg">✕</button>
        </div>

        {allSubtitles && allSubtitles.length > 1 && (
          <div className="flex gap-2 px-6 py-2 border-b border-zinc-100 dark:border-zinc-800">
            {allSubtitles.map((s) => (
              <button key={s.id} onClick={() => setActiveSubId(s.id)}
                className={`text-xs px-2 py-1 rounded ${s.id === activeSubId ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
                {s.filePath?.split('/').pop()}
              </button>
            ))}
          </div>
        )}

        <div ref={cuesRef} className="flex-1 overflow-auto px-6 py-4">
          {hasTiming && cues ? (
            <div className="space-y-1">
              {cues.map((cue, i) => (
                <div key={i}
                  onClick={() => seek(cue.start)}
                  className={`cursor-pointer rounded px-3 py-1.5 text-sm leading-relaxed transition-colors ${activeIdx === i ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-200 font-medium' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                  <span className="text-xs text-zinc-400 mr-2">{formatTime(cue.start)}</span>
                  {cue.text}
                </div>
              ))}
            </div>
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed">{content || '(无内容)'}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(s: number) { const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }
