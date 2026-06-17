import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAdapter } from '@/lib/repository/factory';
import { createReadStream, statSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';

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
    return serveLocalStream(req, track, trackFile, repo);
  }

  return serveRemoteStream(req, track, trackFile, repo);
}

async function serveLocalStream(
  req: NextRequest,
  track: { mimeType: string | null },
  trackFile: { filePath: string },
  repo: { rootPath: string },
): Promise<NextResponse> {
  const fullPath = path.join(repo.rootPath, trackFile.filePath);

  try {
    const stat = statSync(fullPath);
    const fileSize = stat.size;
    const mimeType = track.mimeType || 'audio/mpeg';

    const range = req.headers.get('range');
    if (range) {
      const parts = range.replace('bytes=', '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (isNaN(start) || start < 0 || start >= fileSize) {
        return new NextResponse('Range Not Satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }

      const chunkSize = end - start + 1;
      const stream = createReadStream(fullPath, { start, end });
      const nodeStream = Readable.toWeb(stream) as ReadableStream;

      return new NextResponse(nodeStream, {
        status: 206,
        headers: {
          'Content-Type': mimeType,
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Length': String(chunkSize),
          'Accept-Ranges': 'bytes',
        },
      });
    }

    const stream = createReadStream(fullPath);
    const nodeStream = Readable.toWeb(stream) as ReadableStream;

    return new NextResponse(nodeStream, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(fileSize),
        'Accept-Ranges': 'bytes',
      },
    });
  } catch {
    return new NextResponse('File not accessible', { status: 404 });
  }
}

async function serveRemoteStream(
  _req: NextRequest,
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

    const range = _req.headers.get('range');
    const headers: Record<string, string> = {};
    if (range) headers['Range'] = range;

    const remoteRes = await fetch(streamUrl, { headers });

    if (!remoteRes.ok || !remoteRes.body) {
      return new NextResponse('Remote file not accessible', { status: 404 });
    }

    // Pipe the upstream response stream directly
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', track.mimeType || metadata.mimeType || 'audio/mpeg');
    responseHeaders.set('Accept-Ranges', 'bytes');

    const contentRange = remoteRes.headers.get('Content-Range');
    if (contentRange) responseHeaders.set('Content-Range', contentRange);

    const contentLength = remoteRes.headers.get('Content-Length');
    if (contentLength) responseHeaders.set('Content-Length', contentLength);

    const status = range ? 206 : 200;
    return new NextResponse(remoteRes.body, { status, headers: responseHeaders });
  } catch (err) {
    return new NextResponse(
      `Remote file not accessible: ${err instanceof Error ? err.message : 'Unknown error'}`,
      { status: 404 },
    );
  }
}
