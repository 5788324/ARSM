import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { prisma } from '@/lib/prisma';
import { runImport, scanDirectory } from '@/lib/import/service';
import { LocalAdapter } from '@/lib/repository/local';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    storageRepository: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    work: { create: vi.fn(), findMany: vi.fn() },
    track: { create: vi.fn() },
    trackFile: { create: vi.fn() },
    circle: { upsert: vi.fn() },
  },
}));

describe('Import Service — scanDirectory', () => {
  const testDir = path.join(os.tmpdir(), 'arsm-import-svc-' + Date.now());

  beforeAll(() => {
    fs.mkdirSync(path.join(testDir, 'Work1'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'Work1', '01-intro.mp3'), 'test audio');
    fs.writeFileSync(path.join(testDir, 'Work1', '02-main.flac'), 'test audio 2');
    fs.writeFileSync(path.join(testDir, 'Work1', 'cover.jpg'), 'image');
    fs.writeFileSync(path.join(testDir, 'Work1', 'readme.txt'), 'text');
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('groups audio files into works by folder', async () => {
    const result = await scanDirectory(testDir);

    expect(result.workGroups).toHaveLength(1);
    expect(result.workGroups[0].tracks).toHaveLength(2);
    expect(result.workGroups[0].coverPath).toBeTruthy();
    expect(result.workGroups[0].subtitleFiles.length).toBeGreaterThanOrEqual(0);
  });

  it('extracts track numbers from filenames', async () => {
    const result = await scanDirectory(testDir);
    const tracks = result.workGroups[0].tracks;
    expect(tracks[0].trackNumber).toBe(1);
    expect(tracks[1].trackNumber).toBe(2);
  });
});

describe('Import Service — runImport', () => {
  const testDir = path.join(os.tmpdir(), 'arsm-runimport-' + Date.now());

  beforeEach(() => {
    vi.clearAllMocks();
    const mockRepo = { id: 'repo-1', name: 'test', type: 'local', rootPath: testDir, config: null, isEnabled: true, createdAt: new Date() };
    (prisma.storageRepository.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(mockRepo);
    (prisma.work.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'work-1' });
    (prisma.track.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'track-1' });
    (prisma.trackFile.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'tf-1' });
    (prisma.work.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.circle.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'circle-1', name: 'Test Circle' });
  });

  beforeAll(() => {
    fs.mkdirSync(path.join(testDir, 'RJ123456 Test'), { recursive: true });
    fs.writeFileSync(path.join(testDir, 'RJ123456 Test', '01-intro.mp3'), 'test audio');
    fs.writeFileSync(path.join(testDir, 'RJ123456 Test', 'cover.jpg'), 'test cover');
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('imports works and tracks using shared service', async () => {
    const result = await runImport({ rootPath: testDir });

    expect(result.status).toBe('done');
    expect(result.foundWorks).toBeGreaterThan(0);
    expect(result.foundTracks).toBeGreaterThan(0);
    expect(prisma.work.create).toHaveBeenCalled();
    expect(prisma.track.create).toHaveBeenCalled();
    expect(prisma.trackFile.create).toHaveBeenCalled();
  });

  it('enters review when duplicate work code found', async () => {
    (prisma.work.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'existing-1', displayTitle: 'RJ123456 Test', workCode: 'RJ123456' },
    ]);

    const result = await runImport({ rootPath: testDir });
    expect(result.status).toBe('review');
    expect(result.reviewCount).toBeGreaterThan(0);
    expect(prisma.work.create).not.toHaveBeenCalled();
  });

  it('returns done_with_errors on track creation failure', async () => {
    (prisma.track.create as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB error'));

    const result = await runImport({ rootPath: testDir });
    expect(result.status).toBe('done_with_errors');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('auto-creates repository when none found', async () => {
    (prisma.storageRepository.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.storageRepository.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'auto-repo', name: 'Local Library', type: 'local', rootPath: testDir, config: null, isEnabled: true, createdAt: new Date(),
    });

    const result = await runImport({ rootPath: testDir });
    expect(prisma.storageRepository.create).toHaveBeenCalled();
    expect(result.status).toBe('done');
  });
});
