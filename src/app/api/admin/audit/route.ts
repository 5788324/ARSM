import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAdapter } from '@/lib/repository/factory';

/**
 * Check file availability across all repositories.
 * Returns files whose source repository is not reachable.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const repoId = url.searchParams.get('repositoryId');

  const where = repoId ? { repositoryId: repoId } : {};

  const trackFiles = await prisma.trackFile.findMany({
    where,
    include: {
      track: { select: { title: true } },
      repository: true,
    },
    take: 100,
  });

  const results = await Promise.all(
    trackFiles.map(async (tf) => {
      try {
        const adapter = createAdapter({
          name: tf.repository.name,
          type: tf.repository.type as 'local' | 'openlist' | 'webdav',
          rootPath: tf.repository.rootPath,
          config: tf.repository.config || undefined,
        });

        const exists = await adapter.exists(tf.filePath);
        return {
          id: tf.id,
          trackTitle: tf.track.title,
          repository: tf.repository.name,
          filePath: tf.filePath,
          available: exists,
          fileSize: tf.fileSize,
        };
      } catch {
        return {
          id: tf.id,
          trackTitle: tf.track.title,
          repository: tf.repository.name,
          filePath: tf.filePath,
          available: false,
          fileSize: tf.fileSize,
        };
      }
    }),
  );

  const unavailable = results.filter((r) => !r.available);
  const available = results.filter((r) => r.available);

  return NextResponse.json({
    total: results.length,
    available: available.length,
    unavailable: unavailable.length,
    files: results,
  });
}
