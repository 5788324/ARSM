import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAdapter } from '@/lib/repository/factory';

/** List all repositories or get a single one */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const includeHealth = url.searchParams.get('health') === 'true';

  if (id) {
    const repo = await prisma.storageRepository.findUnique({ where: { id } });
    if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (includeHealth) {
      const healthy = await checkHealth(repo);
      return NextResponse.json({ ...repo, healthy });
    }
    return NextResponse.json(repo);
  }

  const repos = await prisma.storageRepository.findMany({
    orderBy: { createdAt: 'desc' },
  });

  if (includeHealth) {
    const withHealth = await Promise.all(
      repos.map(async (repo) => ({
        ...repo,
        healthy: await checkHealth(repo),
      })),
    );
    return NextResponse.json(withHealth);
  }

  return NextResponse.json(repos);
}

/** Create a new repository */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, type, rootPath, config, isEnabled } = body;

  if (!name || !type || !rootPath) {
    return NextResponse.json({ error: 'name, type, and rootPath are required' }, { status: 400 });
  }

  const validTypes = ['local', 'openlist', 'webdav'];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${validTypes.join(', ')}` }, { status: 400 });
  }

  const repo = await prisma.storageRepository.create({
    data: {
      name,
      type,
      rootPath,
      config: config ? JSON.stringify(config) : null,
      isEnabled: isEnabled !== false,
    },
  });

  return NextResponse.json(repo, { status: 201 });
}

/** Update a repository */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, name, type, rootPath, config, isEnabled } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const existing = await prisma.storageRepository.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.storageRepository.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(rootPath !== undefined && { rootPath }),
      ...(config !== undefined && { config: typeof config === 'string' ? config : JSON.stringify(config) }),
      ...(isEnabled !== undefined && { isEnabled }),
    },
  });

  return NextResponse.json(updated);
}

/** Delete a repository */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Check for attached files
  const filesCount = await prisma.trackFile.count({ where: { repositoryId: id } });
  if (filesCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${filesCount} track files still reference this repository` },
      { status: 409 },
    );
  }

  await prisma.storageRepository.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

async function checkHealth(repo: {
  type: string;
  rootPath: string;
  config: string | null;
}): Promise<boolean> {
  try {
    const adapter = createAdapter({
      name: 'health-check',
      type: repo.type as 'local' | 'openlist' | 'webdav',
      rootPath: repo.rootPath,
      config: repo.config || undefined,
    });

    // Try to list root directory (shallow check)
    const entries = await adapter.listFiles('');
    return entries.length >= 0; // Success if no error thrown
  } catch {
    return false;
  }
}
