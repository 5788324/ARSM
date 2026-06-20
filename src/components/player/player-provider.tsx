'use client';

import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react';

interface TrackItem { id: string; title: string; trackNumber: number; workTitle: string; workId: string; coverPath?: string | null; streamUrl: string; durationSec?: number | null; }

interface PlayerState { queue: TrackItem[]; currentIndex: number; playing: boolean; currentTime: number; duration: number; volume: number; rate: number; loopMode: 'off' | 'one' | 'all'; showQueue: boolean; }

interface PlayerContextValue extends PlayerState {
  play: (track: TrackItem, queue?: TrackItem[]) => void;
  addToQueue: (track: TrackItem) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  setRate: (r: number) => void;
  setLoopMode: (m: 'off' | 'one' | 'all') => void;
  toggleQueue: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);
export function usePlayer() { const ctx = useContext(PlayerContext); if (!ctx) throw new Error('usePlayer: missing PlayerProvider'); return ctx; }

const initialState: PlayerState = { queue: [], currentIndex: -1, playing: false, currentTime: 0, duration: 0, volume: 1, rate: 1, loopMode: 'all', showQueue: false };

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef<PlayerState>({ ...initialState });
  const playTrackRef = useRef<(index: number) => void>(() => {});
  const [state, setState] = useState<PlayerState>({ ...initialState });
  const [init, setInit] = useState(false);

  // Load persisted prefs on mount (client-only, safe)
  useEffect(() => {
    try {
      const v = parseFloat(localStorage.getItem('arsm-volume') || '1');
      const r = parseFloat(localStorage.getItem('arsm-rate') || '1');
      const lm = (localStorage.getItem('arsm-loop') as PlayerState['loopMode']) || 'all';
      setState((s) => ({ ...s, volume: isNaN(v) ? 1 : v, rate: isNaN(r) ? 1 : r, loopMode: lm }));
      stateRef.current.volume = isNaN(v) ? 1 : v;
      stateRef.current.rate = isNaN(r) ? 1 : r;
      stateRef.current.loopMode = lm;
    } catch {}
    setInit(true);
  }, []);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (!init) return;
    if (!audioRef.current) { audioRef.current = new Audio(); audioRef.current.preload = 'auto'; }
    const a = audioRef.current;
    const onTime = () => setState((s) => ({ ...s, currentTime: a.currentTime }));
    const onDur = () => setState((s) => ({ ...s, duration: a.duration }));
    const onEnd = () => {
      const s = stateRef.current;
      if (s.loopMode === 'one') { a.currentTime = 0; a.play().catch(() => {}); setState((p) => ({ ...p, currentTime: 0 })); return; }
      const nextIdx = s.currentIndex + 1;
      if (nextIdx < s.queue.length) { setTimeout(() => playTrackRef.current(nextIdx), 200); }
      else if (s.loopMode === 'all') { setTimeout(() => playTrackRef.current(0), 200); }
      else { setState((p) => ({ ...p, playing: false })); }
    };
    const onErr = () => { setState((s) => ({ ...s, playing: false })); };
    a.addEventListener('timeupdate', onTime); a.addEventListener('loadedmetadata', onDur);
    a.addEventListener('ended', onEnd); a.addEventListener('error', onErr);
    return () => {
      a.removeEventListener('timeupdate', onTime); a.removeEventListener('loadedmetadata', onDur);
      a.removeEventListener('ended', onEnd); a.removeEventListener('error', onErr);
    };
  }, [init]);

  const playTrack = useCallback((index: number) => {
    const q = stateRef.current.queue; const t = q[index];
    if (!t || !audioRef.current) return;
    audioRef.current.src = t.streamUrl; audioRef.current.playbackRate = stateRef.current.rate;
    audioRef.current.volume = stateRef.current.volume;
    audioRef.current.play().catch(() => {});
    setState((s) => ({ ...s, currentIndex: index, playing: true }));
  }, []);
  useEffect(() => { playTrackRef.current = playTrack; }, [playTrack]);

  const play = useCallback((track: TrackItem, queue?: TrackItem[]) => {
    const newQueue = queue || [track]; const idx = newQueue.findIndex((t) => t.id === track.id);
    // Immediately update ref so playTrack reads correct queue
    stateRef.current.queue = newQueue;
    setState((s) => ({ ...s, queue: newQueue }));
    const targetIdx = idx >= 0 ? idx : 0;
    // Small delay to let React flush state, then play
    setTimeout(() => playTrack(targetIdx), 10);
  }, [playTrack]);

  const addToQueue = useCallback((track: TrackItem) => {
    setState((s) => { const q = [...s.queue, track]; stateRef.current.queue = q; return { ...s, queue: q }; });
  }, []);
  const removeFromQueue = useCallback((index: number) => {
    setState((s) => {
      const q = [...s.queue]; const removed = q[index];
      q.splice(index, 1);
      let ci = s.currentIndex;
      if (index < s.currentIndex) ci = s.currentIndex - 1;
      else if (index === s.currentIndex) ci = -1;
      stateRef.current.queue = q;
      // Stop audio if we removed the currently playing track
      if (index === s.currentIndex && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      return { ...s, queue: q, currentIndex: q.length === 0 ? -1 : ci, playing: index === s.currentIndex ? false : s.playing };
    });
  }, []);
  const clearQueue = useCallback(() => {
    stateRef.current.queue = [];
    setState((s) => ({ ...s, queue: [], currentIndex: -1, playing: false }));
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (state.playing) { audioRef.current.pause(); setState((s) => ({ ...s, playing: false })); }
    else { audioRef.current.play().catch(() => {}); setState((s) => ({ ...s, playing: true })); }
  }, [state.playing]);
  const next = useCallback(() => { const ni = state.currentIndex + 1; if (ni < state.queue.length) playTrack(ni); }, [state.currentIndex, state.queue.length, playTrack]);
  const prev = useCallback(() => { const pi = state.currentIndex - 1; if (pi >= 0) playTrack(pi); }, [state.currentIndex, playTrack]);
  const seek = useCallback((t: number) => { if (audioRef.current) audioRef.current.currentTime = t; setState((s) => ({ ...s, currentTime: t })); }, []);
  const setVolume = useCallback((v: number) => { if (audioRef.current) audioRef.current.volume = v; setState((s) => ({ ...s, volume: v })); try { localStorage.setItem('arsm-volume', String(v)); } catch {} }, []);
  const setRate = useCallback((r: number) => { if (audioRef.current) audioRef.current.playbackRate = r; setState((s) => ({ ...s, rate: r })); try { localStorage.setItem('arsm-rate', String(r)); } catch {} }, []);
  const setLoopMode = useCallback((m: 'off' | 'one' | 'all') => { setState((s) => ({ ...s, loopMode: m })); try { localStorage.setItem('arsm-loop', m); } catch {} }, []);
  const toggleQueue = useCallback(() => { setState((s) => ({ ...s, showQueue: !s.showQueue })); }, []);

  const fmt = (t: number) => { const m = Math.floor(t / 60); return m + ':' + String(Math.floor(t % 60)).padStart(2, '0'); };
  const currentTrack = state.currentIndex >= 0 ? state.queue[state.currentIndex] : null;
  const loopLabel = state.loopMode === 'one' ? '🔂' : state.loopMode === 'all' ? '🔁' : '▶';

  return (
    <PlayerContext.Provider value={{ ...state, play, addToQueue, removeFromQueue, clearQueue, togglePlay, next, prev, seek, setVolume, setRate, setLoopMode, toggleQueue }}>
      {children}
      {init && currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 pb-safe">
          <div className="mx-auto max-w-5xl px-4 py-2">
            <div className="flex items-center gap-3">
              {currentTrack.coverPath ? (
                <img src={`/api/covers/${currentTrack.workId}`} alt="" className="h-10 w-10 flex-shrink-0 rounded-md bg-zinc-100 object-cover dark:bg-zinc-800" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className="h-10 w-10 flex-shrink-0 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">♪</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{currentTrack.title}</p>
                <p className="truncate text-xs text-zinc-500">{currentTrack.workTitle}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-zinc-400">{fmt(state.currentTime)}</span>
                  <div className="h-1 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-700 cursor-pointer" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); seek((e.clientX - rect.left) / rect.width * (state.duration || 1)); }}>
                    <div className="h-full rounded-full bg-zinc-600 dark:bg-zinc-300" style={{ width: state.duration ? (state.currentTime / state.duration) * 100 + '%' : '0%' }} />
                  </div>
                  <span className="text-xs text-zinc-400">{fmt(state.duration || 0)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={prev} className="rounded p-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">⏮</button>
                <button onClick={togglePlay} className="rounded p-1 text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">{state.playing ? '⏸' : '▶'}</button>
                <button onClick={next} className="rounded p-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">⏭</button>
                <button onClick={() => setLoopMode(state.loopMode === 'off' ? 'all' : state.loopMode === 'all' ? 'one' : 'off')} className="rounded p-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800">{loopLabel}</button>
                <select value={state.rate} onChange={(e) => setRate(parseFloat(e.target.value))} className="rounded border border-zinc-200 bg-transparent px-1 py-0.5 text-xs dark:border-zinc-700">
                  {[0.75, 1, 1.25, 1.5, 2].map((r) => <option key={r} value={r}>{r}x</option>)}
                </select>
                <button onClick={toggleQueue} className="rounded p-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800" title="队列">📋</button>
              </div>
            </div>
          </div>

          {state.showQueue && state.queue.length > 0 && (
            <div className="mx-auto max-w-5xl px-4 pb-2 max-h-48 overflow-auto border-t border-zinc-100 dark:border-zinc-800 pt-2">
              {state.queue.map((t, i) => (
                <div key={i} className={`flex items-center gap-2 py-1 text-xs ${i === state.currentIndex ? 'text-blue-600 font-medium' : 'text-zinc-600 dark:text-zinc-400'}`}>
                  <button onClick={() => playTrack(i)} className="flex-shrink-0">{i === state.currentIndex && state.playing ? '⏸' : '▶'}</button>
                  <span className="flex-1 truncate">{t.title}</span>
                  <button onClick={() => removeFromQueue(i)} className="text-zinc-400 hover:text-red-500">✕</button>
                </div>
              ))}
              <button onClick={clearQueue} className="mt-1 text-xs text-red-500 hover:underline">清空队列</button>
            </div>
          )}
        </div>
      )}
    </PlayerContext.Provider>
  );
}
