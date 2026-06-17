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
    let reviewCount = 0;
    const importErrors: string[] = [];
    const reviewCandidates: Record<string, unknown>[] = [];

    for (const group of result.workGroups) {
      try {
        // Extract potential work code from folder name (e.g., "RJ123456 Work Title")
        const codeMatch = group.folderName.match(/\b(RJ|VJ|BJ)\d{4,}\b/i);
        const folderCode = codeMatch ? codeMatch[0].toUpperCase() : null;

        const circleName = group.folderPath.split('/')[0] || null;

        // --- Duplicate detection ---
        const duplicateCandidates: { id: string; displayTitle: string; workCode?: string | null }[] = [];

        // Check by work code
        if (folderCode) {
          const codeMatches = await prisma.work.findMany({
            where: { workCode: folderCode },
            select: { id: true, displayTitle: true, workCode: true },
          });
          duplicateCandidates.push(...codeMatches);
        }

        // Check by normalized title + same circle
        if (duplicateCandidates.length === 0) {
          const titleNorm = group.folderName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
          const titleMatches = await prisma.work.findMany({
            where: {
              displayTitle: { contains: group.folderName.substring(0, 15) },
            },
            select: { id: true, displayTitle: true, workCode: true },
            take: 5,
          });
          // Filter for strong similarity
          for (const m of titleMatches) {
            const mNorm = m.displayTitle.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
            if (mNorm === titleNorm || mNorm.includes(titleNorm) || titleNorm.includes(mNorm)) {
              duplicateCandidates.push(m);
            }
          }
          // Deduplicate
        }

        // If duplicates found, queue for review instead of auto-creating
        if (duplicateCandidates.length > 0) {
          reviewCount++;
          reviewCandidates.push({
            folderName: group.folderName,
            folderCode,
            trackCount: group.tracks.length,
            candidateWorks: duplicateCandidates.map((d) => ({
              id: d.id,
              title: d.displayTitle,
              code: d.workCode,
            })),
          });
          continue; // Skip creating
        }

        // No duplicates — create work
        // Find or create circle
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
            workCode: folderCode,
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
    const finalStatus = reviewCount > 0 ? 'review' : (importErrors.length > 0 ? 'done' : 'done');

    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: finalStatus,
        totalFiles: result.totalFiles,
        foundWorks,
        foundTracks,
        errors: importErrors.length > 0 ? JSON.stringify(importErrors) : null,
        finishedAt: new Date(),
      },
    });

    return NextResponse.json({
      jobId: job.id,
      status: finalStatus,
      foundWorks,
      foundTracks,
      reviewCount,
      totalFiles: result.totalFiles,
      skippedFiles: result.skippedFiles.length,
      errors: importErrors,
      reviewCandidates: reviewCandidates.length > 0 ? reviewCandidates : undefined,
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
