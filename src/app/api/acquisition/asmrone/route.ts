/**
 * ⚠ Redirects to unified /api/acquisition/jobs.
 *
 * This provider-specific route is kept for backward compatibility.
 * New code should use /api/acquisition/jobs with providerId.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createAcquisitionJob } from '@/lib/acquisition/runner';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 });

  const body = await req.json();
  const { action, input, targetDir } = body;

  if (action === 'inspect' || action === 'download') {
    // Legacy: create a unified acquisition job with autoImport
    const job = await createAcquisitionJob({
      providerId: 'asmrone',
      input,
      targetDir: targetDir || 'C:/Users/YANG/Music/arsm.one',
      autoImport: action === 'download',
    });
    return NextResponse.json({ ok: true, action, data: job });
  }

  return NextResponse.json({ ok: false, error: `未知 action: "${action}"` }, { status: 400 });
}
