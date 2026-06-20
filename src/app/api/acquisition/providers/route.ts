import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listProviders } from '@/lib/acquisition/registry';

/** GET /api/acquisition/providers — list available providers */
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 });

  const providers = listProviders().map((p) => ({
    id: p.id,
    displayName: p.displayName,
  }));

  return NextResponse.json({ ok: true, data: providers });
}
