import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProvider } from '@/lib/metadata/provider';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { workId, provider: providerName, queryType, queryValue } = body;

  if (!providerName || !queryType || !queryValue) {
    return NextResponse.json(
      { error: 'provider, queryType, and queryValue required' },
      { status: 400 },
    );
  }

  const provider = getProvider(providerName);
  if (!provider) {
    return NextResponse.json(
      { error: `Unknown provider: ${providerName}. Available: ${[...getProvider.name]}` },
      { status: 400 },
    );
  }

  // Create metadata job
  const job = await prisma.metadataJob.create({
    data: {
      userId: session.user!.id!,
      workId: workId || null,
      queryType: queryType as string,
      queryValue,
      provider: providerName,
      status: 'running',
    },
  });

  try {
    let metadata;

    switch (queryType) {
      case 'url':
        metadata = await provider.fetchByUrl(queryValue);
        break;
      case 'code':
        metadata = await provider.fetchByCode(queryValue);
        break;
      case 'title':
        return NextResponse.json(
          { error: 'Title search 暂不支持，请使用 URL 或编号。' },
          { status: 400 },
        );
      default:
        throw new Error(`Unsupported query type: ${queryType}`);
    }

    // Store result as preview (not yet applied)
    await prisma.metadataJob.update({
      where: { id: job.id },
      data: {
        status: 'done',
        resultJson: JSON.stringify(metadata),
        finishedAt: new Date(),
      },
    });

    return NextResponse.json({
      jobId: job.id,
      status: 'done',
      metadata,
    });
  } catch (err) {
    await prisma.metadataJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        resultJson: JSON.stringify({
          error: err instanceof Error ? err.message : 'Unknown error',
        }),
        finishedAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Metadata fetch failed' },
      { status: 500 },
    );
  }
}
