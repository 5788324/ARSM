import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LocalAdapter } from '@/lib/repository/local';
import { scanLocalDirectory } from '@/lib/scanner';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/**
 * Run ffprobe on a file and return JSON metadata.
 */
async function ffprobeFile(filePath: string): Promise<{
  durationSec: number;
  bitrateKbps: number;
  mimeType: string;
} | null> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ], { timeout: 15000 });

    const data = JSON.parse(stdout);
    const format = data.format || {};
    const audioStream = (data.streams || []).find(
      (s: { codec_type: string }) => s.codec_type === 'audio',
    );

    return {
      durationSec: Math.round(parseFloat(format.duration) || 0),
      bitrateKbps: Math.round((parseInt(format.bit_rate, 10) || 0) / 1000),
      mimeType: audioStream?.codec_name === 'flac'
        ? 'audio/flac'
        : audioStream?.codec_name === 'aac'
          ? 'audio/aac'
          : `audio/${audioStream?.codec_name || 'mpeg'}`,
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { repositoryId, rootPath: customRootPath } = body;

  // Get the repository config
  let repo;
  if (repositoryId) {
    repo = await prisma.storageRepository.findUnique({ where: { id: repositoryId } });
  } else {
    // Use default local repository or create one
    repo = await prisma.storageRepository.findFirst({
      where: { type: 'local', isEnabled: true },
    });

    if (!repo) {
      // Create default local repository
      const rootPath = customRootPath || process.env.LIBRARY_ROOT || 'G:/Media/ASMR';
      repo = await prisma.storageRepository.create({
        data: {
          name: 'Local Library',
          type: 'local',
          rootPath,
          isEnabled: true,
        },
      });
    }
  }

  if (!repo || repo.type !== 'local') {
    return NextResponse.json({ error: 'Only local repositories supported in MVP' }, { status: 400 });
  }

  const adapter = new LocalAdapter(repo.name, repo.rootPath);

  // scanRelative: path inside the repo to scan; "." for entire repo
  const scanRelative = customRootPath ? (customRootPath.startsWith(repo.rootPath) ? customRootPath.slice(repo.rootPath.length).replace(/^[/\\]+/, '') || '.' : customRootPath) : '.';

  // Create import job record
  const job = await prisma.importJob.create({
    data: {
      userId: session.user!.id!,
      repositoryId: repo.id,
      status: 'running',
    },
  });

  try {
    // Scan directory
    const result = await scanLocalDirectory(scanRelative, adapter);

    // Import each work group
    let foundWorks = 0;
    let foundTracks = 0;
    const importErrors: string[] = [];

    for (const group of result.workGroups) {
      try {
        // Find or create circle (from folder structure heuristics)
        const circleName = group.folderPath.split('/')[0] || null;

        let circleId: string | null = null;
        if (circleName) {
          const circle = await prisma.circle.upsert({
            where: { name: circleName },
            update: {},
            create: { name: circleName },
          });
          circleId = circle.id;
        }

        // Create work
        const work = await prisma.work.create({
          data: {
            displayTitle: group.folderName,
            originalTitle: group.folderName,
            coverPath: group.coverPath || null,
            circleId,
            trackCount: group.tracks.length,
          },
        });

        foundWorks++;

        // Create tracks
        for (const trackCandidate of group.tracks) {
          try {
            const fullPath = await adapter.resolvePath(trackCandidate.relativePath);
            const probeResult = await ffprobeFile(fullPath);

            const track = await prisma.track.create({
              data: {
                workId: work.id,
                trackNumber: trackCandidate.trackNumber,
                title: trackCandidate.filename.replace(/\.[^.]+$/, ''),
                durationSec: probeResult?.durationSec || null,
                mimeType: probeResult?.mimeType || 'audio/mpeg',
                bitrateKbps: probeResult?.bitrateKbps || null,
              },
            });

            // Create track file reference
            await prisma.trackFile.create({
              data: {
                trackId: track.id,
                repositoryId: repo.id,
                filePath: trackCandidate.relativePath,
                fileSize: trackCandidate.size,
                isAvailable: true,
              },
            });

            foundTracks++;
          } catch (err) {
            importErrors.push(
              `Track "${trackCandidate.filename}": ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }

        // Update work duration
        const trackDurations = await prisma.track.findMany({
          where: { workId: work.id },
          select: { durationSec: true },
        });
        const totalDuration = trackDurations.reduce(
          (sum, t) => sum + (t.durationSec || 0),
          0,
        );
        await prisma.work.update({
          where: { id: work.id },
          data: { durationSec: totalDuration },
        });
      } catch (err) {
        importErrors.push(
          `Work "${group.folderName}": ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Update job status
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: importErrors.length > 0 ? 'done' : 'done',
        totalFiles: result.totalFiles,
        foundWorks,
        foundTracks,
        errors: importErrors.length > 0 ? JSON.stringify(importErrors) : null,
        finishedAt: new Date(),
      },
    });

    return NextResponse.json({
      jobId: job.id,
      status: 'done',
      foundWorks,
      foundTracks,
      totalFiles: result.totalFiles,
      skippedFiles: result.skippedFiles.length,
      errors: importErrors,
    });
  } catch (err) {
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        errors: JSON.stringify([err instanceof Error ? err.message : String(err)]),
        finishedAt: new Date(),
      },
    });

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 },
    );
  }
}
