'use client';

import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from 'react';

interface TrackItem {
  id: string;
  title: string;
  trackNumber: number;
  workTitle: string;
  workId: string;
  coverPath?: string | null;
  streamUrl: string;
  durationSec?: number | null;
}

interface PlayerState {
  queue: TrackItem[];
  currentIndex: number;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  rate: number;
}

interface PlayerContextValue extends PlayerState {
  play: (track: TrackItem, queue?: TrackItem[]) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  setRate: (r: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider');
  return ctx;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef<PlayerState>({ queue: [], currentIndex: -1, playing: false, currentTime: 0, duration: 0, volume: 1, rate: 1 });
  const playTrackRef = useRef<(index: number) => void>(() => {});
  const [state, setState] = useState<PlayerState>(stateRef.current);

  useEffect(() => { stateRef.current = state; }, [state]);

  // Init audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }
    const a = audioRef.current;
    const onTime = () => setState((s) => ({ ...s, currentTime: a.currentTime }));
    const onDur = () => setState((s) => ({ ...s, duration: a.duration }));
    const onEnd = () => {
      const s = stateRef.current;
      const nextIdx = s.currentIndex + 1;
      if (nextIdx < s.queue.length) {
        setTimeout(() => playTrackRef.current(nextIdx), 200);
      } else {
        setState((prev) => ({ ...prev, playing: false }));
      }
    };
    const onErr = () => { setState((s) => ({ ...s, playing: false })); };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onDur);
    a.addEventListener('ended', onEnd);
    a.addEventListener('error', onErr);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onDur);
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('error', onErr);
    };
  }, []);

  const playTrack = useCallback((index: number) => {
    const q = stateRef.current.queue;
    const t = q[index];
    if (!t || !audioRef.current) return;
    audioRef.current.src = t.streamUrl;
    audioRef.current.playbackRate = stateRef.current.rate;
    audioRef.current.volume = stateRef.current.volume;
    audioRef.current.play().catch(() => {});
    setState((s) => ({ ...s, currentIndex: index, playing: true }));
  }, []);

  // Keep playTrackRef current so onEnd always calls latest
  useEffect(() => { playTrackRef.current = playTrack; }, [playTrack]);

  const play = useCallback((track: TrackItem, queue?: TrackItem[]) => {
    const newQueue = queue || [track];
    const idx = newQueue.findIndex((t) => t.id === track.id);
    setState((s) => ({ ...s, queue: newQueue }));
    setTimeout(() => playTrack(idx >= 0 ? idx : 0), 0);
  }, [playTrack]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (state.playing) { audioRef.current.pause(); setState((s) => ({ ...s, playing: false })); }
    else { audioRef.current.play().catch(() => {}); setState((s) => ({ ...s, playing: true })); }
  }, [state.playing]);

  const next = useCallback(() => {
    const nextIdx = state.currentIndex + 1;
    if (nextIdx < state.queue.length) playTrack(nextIdx);
  }, [state.currentIndex, state.queue.length, playTrack]);

  const prev = useCallback(() => {
    const prevIdx = state.currentIndex - 1;
    if (prevIdx >= 0) playTrack(prevIdx);
  }, [state.currentIndex, playTrack]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
    setState((s) => ({ ...s, currentTime: time }));
  }, []);

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setState((s) => ({ ...s, volume: v }));
  }, []);

  const setRate = useCallback((r: number) => {
    if (audioRef.current) audioRef.current.playbackRate = r;
    setState((s) => ({ ...s, rate: r }));
  }, []);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentTrack = state.currentIndex >= 0 ? state.queue[state.currentIndex] : null;

  return (
    <PlayerContext.Provider value={{ ...state, play, togglePlay, next, prev, seek, setVolume, setRate }}>
      {children}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 pb-safe">
          <div className="mx-auto max-w-5xl px-4 py-2">
            <div className="flex items-center gap-3">
              <img
                src={currentTrack.coverPath ? `/api/covers/${currentTrack.workId}` : ''}
                alt=""
                className="h-10 w-10 flex-shrink-0 rounded-md bg-zinc-100 object-cover dark:bg-zinc-800"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{currentTrack.title}</p>
                <p className="truncate text-xs text-zinc-500">{currentTrack.workTitle}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-zinc-400">{formatTime(state.currentTime)}</span>
                  <div className="h-1 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-700 cursor-pointer" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    seek(pct * (state.duration || 1));
                  }}>
                    <div className="h-full rounded-full bg-zinc-600 dark:bg-zinc-300" style={{ width: `${state.duration ? (state.currentTime / state.duration) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-zinc-400">{formatTime(state.duration || 0)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={prev} className="rounded p-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">⏮</button>
                <button onClick={togglePlay} className="rounded p-1 text-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">{state.playing ? '⏸' : '▶'}</button>
                <button onClick={next} className="rounded p-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">⏭</button>
                <select value={state.rate} onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="ml-2 rounded border border-zinc-200 bg-transparent px-1 py-0.5 text-xs dark:border-zinc-700">
                  {[0.75, 1, 1.25, 1.5, 2].map((r) => <option key={r} value={r}>{r}x</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </PlayerContext.Provider>
  );
}
