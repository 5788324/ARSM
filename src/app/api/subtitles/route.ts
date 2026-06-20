import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parseSubtitle } from '@/lib/subtitles/parser';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const url = new URL(req.url);
  const subId = url.searchParams.get('id');
  if (!subId) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

  const { prisma } = await import('@/lib/prisma');
  const sub = await (prisma as any).trackSubtitle.findUnique({ where: { id: subId } });
  if (!sub) return NextResponse.json({ error: '字幕未找到' }, { status: 404 });

  try {
    const repo = await prisma.storageRepository.findUnique({ where: { id: sub.repositoryId } });
    const fullPath = repo ? join(repo.rootPath, sub.filePath) : sub.filePath;

    if (['txt', 'vtt', 'srt', 'lrc'].includes(sub.kind)) {
      const content = await readFile(fullPath, 'utf-8').catch(() => '(无法读取文件)');
      const cues = parseSubtitle(content, sub.kind);
      return NextResponse.json({ ok: true, data: { ...sub, content: content.substring(0, 50000), cues, hasTiming: cues !== null } });
    }

    return NextResponse.json({ ok: true, data: { ...sub, content: null, cues: null, hasTiming: false, message: 'PDF 文件，请下载后查看' } });
  } catch {
    return NextResponse.json({ ok: true, data: { ...sub, content: '(无法读取文件)', cues: null, hasTiming: false } });
  }
}
