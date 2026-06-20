import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import MobileNav from '@/components/mobile-nav';
import { SiteHeader } from '@/components/site-header';
import { auth } from '@/lib/auth';
import { PlayerProvider } from '@/components/player/player-provider';
import { ThemeInit } from '@/components/theme-toggle';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ARSM — 私人音频图书馆',
  description: '私人 ASMR 与音频图书馆',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'ARSM' },
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' as const };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head><ThemeInit /></head>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 pb-16 md:pb-0">
        <PlayerProvider>
          <SiteHeader signedIn={!!session} userName={session?.user?.name} />
          {children}
          <MobileNav />
        </PlayerProvider>
      </body>
    </html>
  );
}
