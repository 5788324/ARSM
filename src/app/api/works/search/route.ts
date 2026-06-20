import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchWorks } from '@/lib/works/search-service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 });

  const url = new URL(req.url);
  const query = {
    keyword: url.searchParams.get('keyword') || undefined,
    circleId: url.searchParams.get('circleId') || undefined,
    vaId: url.searchParams.get('vaId') || undefined,
    tagId: url.searchParams.get('tagId') || undefined,
    hasSubtitle: url.searchParams.get('hasSubtitle') === 'true' || undefined,
    favorite: url.searchParams.get('favorite') === 'true' || undefined,
    userId: session.user?.id,
    sort: (url.searchParams.get('sort') as any) || 'recent',
    page: parseInt(url.searchParams.get('page') || '1'),
    pageSize: parseInt(url.searchParams.get('pageSize') || '20'),
  };

  const result = await searchWorks(query);
  return NextResponse.json({ ok: true, data: result });
}
