import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import MobileNav from '@/components/mobile-nav';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

export const metadata: Metadata = {
  title: 'ARSM - 私人音频图书馆',
  description: '本地 ASMR 音频收藏与播放',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 text-black antialiased">
        <SiteHeader signedIn={!!session} userName={session?.user?.name} />
        {children}
        <MobileNav />
      </body>
    </html>
  );
}

