import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { runImport } from '@/lib/import/service';

/** POST /api/import — scan a directory and import audio works */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await req.json();
  const { rootPath } = body;

  if (!rootPath) {
    return NextResponse.json({ error: '缺少必填参数: rootPath' }, { status: 400 });
  }

  try {
    const result = await runImport({ rootPath });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '导入失败' },
      { status: 500 },
    );
  }
}
