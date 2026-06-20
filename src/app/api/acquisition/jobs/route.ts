import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listProviders } from '@/lib/acquisition/registry';
import { createAcquisitionJob, listAcquisitionJobs, getAcquisitionJob } from '@/lib/acquisition/runner';

function ok(data: unknown) { return NextResponse.json({ ok: true, data }); }
function err(msg: string, code = 400) { return NextResponse.json({ ok: false, error: msg }, { status: code }); }

/** GET /api/acquisition/jobs — list jobs or get one */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (id) {
    const job = await getAcquisitionJob(id);
    return job ? ok(job) : err('任务不存在', 404);
  }

  const jobs = await listAcquisitionJobs();
  return ok(jobs);
}

/** POST /api/acquisition/jobs — create a new acquisition job */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ ok: false, error: '未登录' }, { status: 401 });

  const { providerId, input, targetDir, autoImport, postprocess } = await req.json();
  if (!input || !targetDir) return err('缺少必填参数: input 和 targetDir');

  try {
    const job = await createAcquisitionJob({ providerId, input, targetDir, autoImport, postprocess });
    return ok(job);
  } catch (e) {
    return err(e instanceof Error ? e.message : '创建失败', 500);
  }
}
