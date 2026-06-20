'use client';

import { useState } from 'react';

interface ThemeProviderProps { children: React.ReactNode; }

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') return document.documentElement.classList.contains('dark');
    return false;
  });

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('arsm-theme', next ? 'dark' : 'light');
  };

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
        var theme = localStorage.getItem('arsm-theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        }
      })();
    `}} />
  );
}
