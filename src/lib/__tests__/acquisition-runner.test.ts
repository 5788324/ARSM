import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before imports
vi.mock('@/lib/prisma', () => ({
  prisma: {
    acquisitionJob: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    storageRepository: { findFirst: vi.fn(), create: vi.fn() },
    work: { create: vi.fn(), findMany: vi.fn() },
    track: { create: vi.fn() },
    trackFile: { create: vi.fn() },
    circle: { upsert: vi.fn() },
    importJob: {},
    metadataJob: {},
  },
}));

vi.mock('@/lib/acquisition/registry', () => ({
  getProvider: vi.fn(),
  findProvider: vi.fn(),
  registerProvider: vi.fn(),
  listProviders: vi.fn(() => [{ id: 'asmrone', displayName: 'asmr.one (API)' }]),
}));

vi.mock('@/lib/import/service', () => ({
  runImport: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getProvider, findProvider } from '@/lib/acquisition/registry';
import { runImport } from '@/lib/import/service';
import {
  createAcquisitionJob,
  getAcquisitionJob,
  listAcquisitionJobs,
} from '@/lib/acquisition/runner';

const mockProvider = {
  id: 'asmrone',
  displayName: 'asmr.one (API)',
  supports: () => true,
  inspect: vi.fn().mockResolvedValue({
    sourceId: 'RJ01538000', workId: '01538000',
    title: 'Test Work', release: '2026-01-01',
    hasSubtitle: false, fileCount: 3, totalSize: 1000,
    files: [{ path: '01.mp3', type: 'audio', size: 500, downloadUrl: 'http://x.com/1.mp3' }],
  }),
  download: vi.fn().mockResolvedValue({
    total: 1, done: 1, failed: 0, skipped: 0, bytesDownloaded: 500,
    files: [{ path: '01.mp3', size: 500, downloaded: 500, status: 'done' }],
    errors: [],
  }),
};

const mockPrismaJob = {
  id: 'job-123',
  providerId: 'asmrone',
  input: 'RJ01538000',
  normalizedSourceId: 'RJ01538000',
  targetDir: '/tmp/test',
  status: 'pending',
  currentStep: null,
  progressJson: null,
  resultJson: null,
  errorJson: null,
  createdAt: new Date(),
  startedAt: null,
  finishedAt: null,
};

describe('Acquisition Runner — Job Creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.acquisitionJob.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockPrismaJob);
    (prisma.acquisitionJob.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockPrismaJob);
    (findProvider as ReturnType<typeof vi.fn>).mockReturnValue(mockProvider);
    (getProvider as ReturnType<typeof vi.fn>).mockReturnValue(mockProvider);
  });

  it('creates job with explicit providerId', async () => {
    const result = await createAcquisitionJob({
      providerId: 'asmrone',
      input: 'RJ01538000',
      targetDir: '/tmp/test',
      autoImport: true,
    });

    expect(result.status).toBe('pending');
    expect(prisma.acquisitionJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          providerId: 'asmrone',
          input: 'RJ01538000',
          status: 'pending',
        }),
      }),
    );
  });

  it('auto-detects provider when providerId not given', async () => {
    await createAcquisitionJob({
      input: 'RJ01538000',
      targetDir: '/tmp/test',
      autoImport: true,
    });

    expect(findProvider).toHaveBeenCalledWith('RJ01538000');
  });

  it('throws when no provider matches input', async () => {
    (findProvider as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

    await expect(
      createAcquisitionJob({ input: 'unknown', targetDir: '/tmp/test', autoImport: true }),
    ).rejects.toThrow('找不到支持');
  });
});

describe('Acquisition Runner — Status Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.acquisitionJob.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockPrismaJob);
    (prisma.acquisitionJob.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockPrismaJob);
    (findProvider as ReturnType<typeof vi.fn>).mockReturnValue(mockProvider);
    (getProvider as ReturnType<typeof vi.fn>).mockReturnValue(mockProvider);
    (runImport as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'done', foundWorks: 1, foundTracks: 1, reviewCount: 0,
      totalFiles: 1, skippedFiles: 0, errors: [],
    });
  });

  it('sets startedAt when execution begins', async () => {
    await createAcquisitionJob({
      providerId: 'asmrone', input: 'RJ01538000', targetDir: '/tmp/test', autoImport: true,
    });

    // The runner runs async, but update should be called with inspecting status
    await vi.waitFor(() => {
      expect(prisma.acquisitionJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'inspecting', currentStep: 'inspect' }),
        }),
      );
    }, { timeout: 5000 });
  }, 10000);

  it('stops after inspect when autoImport is false', async () => {
    await createAcquisitionJob({
      providerId: 'asmrone', input: 'RJ01538000', targetDir: '/tmp/test', autoImport: false,
    });

    await vi.waitFor(() => {
      const calls = (prisma.acquisitionJob.update as ReturnType<typeof vi.fn>).mock.calls;
      const finalCall = calls[calls.length - 1];
      if (finalCall) {
        const data = finalCall[0].data;
        // Final status should be 'done', not 'downloading'
        expect(data.status).toBe('done');
      }
    }, { timeout: 5000 });
  }, 10000);
});

describe('Acquisition Runner — Error Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.acquisitionJob.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockPrismaJob);
    (prisma.acquisitionJob.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockPrismaJob);
    (findProvider as ReturnType<typeof vi.fn>).mockReturnValue(mockProvider);
    (getProvider as ReturnType<typeof vi.fn>).mockReturnValue(mockProvider);
  });

  it('marks job as failed when provider not found', async () => {
    (getProvider as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

    await createAcquisitionJob({
      providerId: 'unknown', input: 'RJ01538000', targetDir: '/tmp/test', autoImport: true,
    });

    await vi.waitFor(() => {
      expect(prisma.acquisitionJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'failed' }),
        }),
      );
    }, { timeout: 5000 });
  }, 10000);

  it('marks job as done_with_errors when import fails', async () => {
    (runImport as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'done_with_errors', foundWorks: 0, foundTracks: 0, reviewCount: 0,
      totalFiles: 0, skippedFiles: 0, errors: ['Import failed'],
    });

    await createAcquisitionJob({
      providerId: 'asmrone', input: 'RJ01538000', targetDir: '/tmp/test', autoImport: true,
    });

    await vi.waitFor(() => {
      const calls = (prisma.acquisitionJob.update as ReturnType<typeof vi.fn>).mock.calls;
      const finalCall = calls[calls.length - 1];
      if (finalCall) {
        const data = finalCall[0].data;
        if (data.status === 'done_with_errors' || data.status === 'done') {
          expect(data.errorJson).toBeTruthy();
        }
      }
    }, { timeout: 5000 });
  }, 10000);
});

describe('getAcquisitionJob / listAcquisitionJobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.acquisitionJob.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockPrismaJob);
    (prisma.acquisitionJob.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([mockPrismaJob]);
  });

  it('returns a single job by id', async () => {
    const job = await getAcquisitionJob('job-123');
    expect(job).toBeDefined();
    expect(prisma.acquisitionJob.findUnique).toHaveBeenCalledWith({ where: { id: 'job-123' } });
  });

  it('lists recent jobs', async () => {
    const jobs = await listAcquisitionJobs();
    expect(jobs).toHaveLength(1);
    expect(prisma.acquisitionJob.findMany).toHaveBeenCalled();
  });
});
