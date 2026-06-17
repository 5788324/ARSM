import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAdapter } from '@/lib/repository/factory';
import { createReadStream, statSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workId: string }> },
) {
  const session = await auth();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { workId } = await params;

  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: { coverPath: true, tracks: { take: 1, include: { trackFiles: { include: { repository: true } } } } },
  });

  if (!work) return new NextResponse('Not found', { status: 404 });

  // No cover: return placeholder
  if (!work.coverPath) {
    return new NextResponse('No cover', { status: 404 });
  }

  // Determine repository from first track's file
  const firstTrackFile = work.tracks[0]?.trackFiles[0];
  const repo = firstTrackFile?.repository;

  // If no repo info, try local filesystem as fallback
  if (!repo || repo.type === 'local') {
    const rootPath = repo?.rootPath || process.env.LIBRARY_ROOT || '.';
    const fullPath = path.join(rootPath, work.coverPath);

    try {
      const stat = statSync(fullPath);
      const stream = createReadStream(fullPath);
      const ext = path.extname(work.coverPath).toLowerCase();
      const mimeMap: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

      return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
        headers: {
          'Content-Type': mimeMap[ext] || 'image/jpeg',
          'Content-Length': String(stat.size),
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch {
      return new NextResponse('Cover file not accessible', { status: 404 });
    }
  }

  // Remote repository: fetch cover
  try {
    const adapter = createAdapter({
      name: repo.name,
      type: repo.type as 'openlist' | 'webdav',
      rootPath: repo.rootPath,
      config: repo.config || undefined,
    });

    const buffer = await adapter.readBuffer(work.coverPath);
    const ext = path.extname(work.coverPath).toLowerCase();
    const mimeMap: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeMap[ext] || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('Cover not accessible from remote', { status: 404 });
  }
}
