import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { scanLocalDirectory } from '@/lib/scanner';
import { LocalAdapter } from '@/lib/repository/local';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Import Scanner', () => {
  const testDir = join(tmpdir(), 'arsm-test-scan-' + Date.now());

  beforeAll(() => {
    mkdirSync(join(testDir, 'RJ123456 Sample Work'), { recursive: true });
    writeFileSync(join(testDir, 'RJ123456 Sample Work', '01 - Introduction.mp3'), 'fake mp3');
    writeFileSync(join(testDir, 'RJ123456 Sample Work', '02 - Main Track.flac'), 'fake flac');
    writeFileSync(join(testDir, 'RJ123456 Sample Work', 'cover.jpg'), 'fake cover');
    writeFileSync(join(testDir, 'RJ123456 Sample Work', 'readme.txt'), 'ignored');
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('scans a directory and groups files into works', async () => {
    const adapter = new LocalAdapter('test', testDir);
    const result = await scanLocalDirectory('.', adapter);

    expect(result.errors).toHaveLength(0);
    expect(result.workGroups).toHaveLength(1);

    const group = result.workGroups[0];
    expect(group.folderName).toBe('RJ123456 Sample Work');
    expect(group.tracks).toHaveLength(2);
    expect(group.coverPath).toBeTruthy();

    expect(group.tracks[0].trackNumber).toBe(1);
    expect(group.tracks[0].filename).toBe('01 - Introduction.mp3');
    expect(group.tracks[1].trackNumber).toBe(2);
    expect(group.tracks[1].filename).toBe('02 - Main Track.flac');
  });

  it('skips non-media files', async () => {
    const adapter = new LocalAdapter('test', testDir);
    const result = await scanLocalDirectory('.', adapter);

    expect(result.skippedFiles).toContain('RJ123456 Sample Work/readme.txt');
    expect(result.totalFiles).toBe(5); // includes directory entry
  });
});
