'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '首页', icon: '⌂' },
  { href: '/works', label: '作品库', icon: '♥' },
  { href: '/continue', label: '继续听', icon: '▶' },
  { href: '/favorites', label: '收藏', icon: '★' },
  { href: '/admin', label: '管理', icon: '⚙' },
];

export default function MobileNav() {
  const pathname = usePathname();
  if (pathname.startsWith('/login')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center px-3 py-2 text-xs transition ${isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="mt-0.5">{item.label}</span>
              {isActive && <span className="mt-0.5 h-0.5 w-4 rounded-full bg-zinc-900 dark:bg-zinc-100" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
