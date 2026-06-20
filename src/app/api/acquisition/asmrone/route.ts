import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { inspect, downloadWork, normalizeId } from '@/lib/acquisition/asmrone';

function ok(action: string, data: unknown) {
  return NextResponse.json({ ok: true, action, data });
}

function errMsg(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return errMsg('请求体必须是 JSON');
  }

  const { action, input, targetDir } = body;

  if (!action || !input) {
    return errMsg('缺少必填参数: action 和 input');
  }

  // Pre-validate input format early
  try {
    normalizeId(input);
  } catch (e) {
    return errMsg(e instanceof Error ? e.message : '无效的作品编号');
  }

  try {
    if (action === 'inspect') {
      const result = await inspect(input);
      return ok('inspect', result);
    }

    if (action === 'download') {
      if (!targetDir || typeof targetDir !== 'string') {
        return errMsg('下载模式需要 targetDir 参数');
      }

      const result = await downloadWork(input, targetDir);
      return ok('download', result);
    }

    return errMsg(`未知 action: "${action}"。支持: inspect, download`);
  } catch (err) {
    const message = err instanceof Error ? err.message : '采集失败';
    return NextResponse.json({ ok: false, action, error: message }, { status: 500 });
  }
}
