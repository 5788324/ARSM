import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAdapter } from '@/lib/repository/factory';
import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ trackId: string }> },
) {
  const session = await auth();
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { trackId } = await params;

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    include: {
      trackFiles: {
        include: { repository: true },
      },
    },
  });

  if (!track || track.trackFiles.length === 0) {
    return new NextResponse('Not found', { status: 404 });
  }

  const trackFile = track.trackFiles[0];
  const repo = trackFile.repository;

  if (repo.type === 'local') {
    return serveLocalFile(req, track, trackFile, repo);
  }

  // For remote repositories (openlist, webdav), proxy the stream
  return serveRemoteFile(req, track, trackFile, repo);
}

async function serveLocalFile(
  req: NextRequest,
  track: { mimeType: string | null },
  trackFile: { filePath: string },
  repo: { rootPath: string },
): Promise<NextResponse> {
  const fullPath = path.join(repo.rootPath, trackFile.filePath);

  try {
    const stat = statSync(fullPath);
    const headers = new Headers();
    headers.set('Content-Type', track.mimeType || 'audio/mpeg');
    headers.set('Accept-Ranges', 'bytes');

    const range = req.headers.get('range');
    if (range) {
      const [startStr, endStr] = range.replace('bytes=', '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
      const chunk = readFileSync(fullPath).subarray(start, end + 1);

      headers.set('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      headers.set('Content-Length', String(chunk.byteLength));
      return new NextResponse(chunk, { status: 206, headers });
    }

    headers.set('Content-Length', String(stat.size));
    return new NextResponse(readFileSync(fullPath), { headers });
  } catch {
    return new NextResponse('File not accessible', { status: 404 });
  }
}

async function serveRemoteFile(
  req: NextRequest,
  track: { mimeType: string | null },
  trackFile: { filePath: string },
  repo: { name: string; type: string; rootPath: string; config: string | null },
): Promise<NextResponse> {
  try {
    const adapter = createAdapter({
      name: repo.name,
      type: repo.type as 'openlist' | 'webdav',
      rootPath: repo.rootPath,
      config: repo.config || undefined,
    });

    const streamUrl = await adapter.resolvePath(trackFile.filePath);
    const metadata = await adapter.getMetadata(trackFile.filePath);

    // Fetch the remote file
    const fetchHeaders: Record<string, string> = {};
    const range = req.headers.get('range');
    if (range) {
      fetchHeaders['Range'] = range;
    }

    const remoteRes = await fetch(streamUrl, { headers: fetchHeaders });

    const headers = new Headers();
    headers.set('Content-Type', track.mimeType || metadata.mimeType || 'audio/mpeg');
    headers.set('Accept-Ranges', 'bytes');

    if (remoteRes.headers.get('Content-Range')) {
      headers.set('Content-Range', remoteRes.headers.get('Content-Range')!);
    }
    if (remoteRes.headers.get('Content-Length')) {
      headers.set('Content-Length', remoteRes.headers.get('Content-Length')!);
    }

    const buffer = Buffer.from(await remoteRes.arrayBuffer());
    const status = range ? 206 : 200;
    return new NextResponse(buffer, { status, headers });
  } catch (err) {
    return new NextResponse(
      `Remote file not accessible: ${err instanceof Error ? err.message : 'Unknown error'}`,
      { status: 404 },
    );
  }
}
