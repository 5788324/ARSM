import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchWorks } from '@/lib/works/search-service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 });

  const url = new URL(req.url);
  const query = {
    keyword: url.searchParams.get('keyword') || undefined,
    exclude: url.searchParams.get('exclude') || undefined,
    circleName: url.searchParams.get('circleName') || undefined,
    vaName: url.searchParams.get('vaName') || undefined,
    tagName: url.searchParams.get('tagName') || undefined,
    hasSubtitle: url.searchParams.get('hasSubtitle') === 'true' || undefined,
    minDurationMin: url.searchParams.get('minDurationMin') ? parseInt(url.searchParams.get('minDurationMin')!) : undefined,
    maxDurationMin: url.searchParams.get('maxDurationMin') ? parseInt(url.searchParams.get('maxDurationMin')!) : undefined,
    userId: session.user?.id,
    sort: (url.searchParams.get('sort') as any) || 'recent',
    page: parseInt(url.searchParams.get('page') || '1'),
    pageSize: parseInt(url.searchParams.get('pageSize') || '24'),
  };

  const result = await searchWorks(query);
  return NextResponse.json({ ok: true, data: result });
}
