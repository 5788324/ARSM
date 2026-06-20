'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function SiteHeader({ signedIn, userName }: { signedIn: boolean; userName?: string | null }) {
  const pathname = usePathname();

  if (!signedIn || pathname === '/login') {
    return null;
  }

  const linkClass = (href: string) =>
    pathname === href ? 'font-medium text-black' : 'text-gray-600 hover:text-black';

  return (
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-lg font-semibold text-black">
            ARSM
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <Link href="/works" className={linkClass('/works')}>
              作品库
            </Link>
            <Link href="/favorites" className={linkClass('/favorites')}>
              收藏
            </Link>
            <Link href="/admin" className={linkClass('/admin')}>
              管理
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="hidden sm:inline">{userName ?? '已登录'}</span>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            退出
          </button>
        </div>
      </div>
    </header>
  );
}
