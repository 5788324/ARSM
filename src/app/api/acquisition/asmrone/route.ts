/**
 * ⚠ Backward-compatible route — delegates to unified /api/acquisition/jobs.
 * New code should use /api/acquisition/jobs directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAcquisitionJob } from '@/lib/acquisition/runner';
import { findProvider } from '@/lib/acquisition/registry';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 });

  const body = await req.json();
  const { action, input, targetDir } = body;

  if (!input) return NextResponse.json({ ok: false, error: '缺少 input 参数' }, { status: 400 });

  if (action === 'inspect') {
    // Direct inspect — no job created, no download triggered
    try {
      const provider = findProvider(input);
      if (!provider) return NextResponse.json({ ok: false, error: `找不到支持 "${input}" 的来源` }, { status: 400 });
      const result = await provider.inspect(input);
      return NextResponse.json({ ok: true, action, data: result });
    } catch (err) {
      return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : '探测失败' }, { status: 500 });
    }
  }

  if (action === 'download') {
    // Create acquisition job with autoImport
    const job = await createAcquisitionJob({
      providerId: 'asmrone',
      input,
      targetDir: targetDir || 'C:/Users/YANG/Music/arsm.one',
      autoImport: true,
    });
    return NextResponse.json({ ok: true, action, data: job });
  }

  return NextResponse.json({ ok: false, error: `未知 action: "${action}"。支持: inspect, download` }, { status: 400 });
}
