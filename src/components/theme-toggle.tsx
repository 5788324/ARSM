'use client';

import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    setReady(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('arsm-theme', next ? 'dark' : 'light'); } catch {}
  };

  if (!ready) return null;

  return (
    <button onClick={toggle} className="rounded p-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800" title={dark ? '浅色模式' : '深色模式'}>
      {dark ? '☀' : '🌙'}
    </button>
  );
}

export function ThemeInit() {
  return (
    <script dangerouslySetInnerHTML={{ __html: `
      (function() {
        try {
          var theme = localStorage.getItem('arsm-theme');
          if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
          }
        } catch(e) {}
      })();
    `}} />
  );
}
