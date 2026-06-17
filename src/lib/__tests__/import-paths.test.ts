import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { scanLocalDirectory } from '@/lib/scanner';
import { LocalAdapter } from '@/lib/repository/local';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Import path scenarios', () => {
  const testDir = join(tmpdir(), 'arsm-import-test-' + Date.now());

  beforeAll(() => {
    // Create nested structure:
    // testDir/
    //   CircleA/
    //     Work1/
    //       01-track.mp3
    //       cover.jpg
    //     Work2/
    //       01-intro.flac
    //       02-main.flac
    mkdirSync(join(testDir, 'CircleA', 'Work1'), { recursive: true });
    mkdirSync(join(testDir, 'CircleA', 'Work2'), { recursive: true });
    writeFileSync(join(testDir, 'CircleA', 'Work1', '01-track.mp3'), 'audio');
    writeFileSync(join(testDir, 'CircleA', 'Work1', 'cover.jpg'), 'image');
    writeFileSync(join(testDir, 'CircleA', 'Work2', '01-intro.flac'), 'audio');
    writeFileSync(join(testDir, 'CircleA', 'Work2', '02-main.flac'), 'audio');
  });

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('scans entire repository root', async () => {
    const adapter = new LocalAdapter('test', testDir);
    const result = await scanLocalDirectory('.', adapter);

    expect(result.errors).toHaveLength(0);
    expect(result.workGroups).toHaveLength(2);

    const names = result.workGroups.map((g) => g.folderName).sort();
    expect(names).toEqual(['Work1', 'Work2']);

    const work1 = result.workGroups.find((g) => g.folderName === 'Work1')!;
    expect(work1.tracks).toHaveLength(1);
    expect(work1.coverPath).toBeTruthy();

    const work2 = result.workGroups.find((g) => g.folderName === 'Work2')!;
    expect(work2.tracks).toHaveLength(2);
  });

  it('scans nested subfolder under repository root', async () => {
    const adapter = new LocalAdapter('test', testDir);
    const result = await scanLocalDirectory('CircleA/Work1', adapter);

    // Files directly in the scanned folder are grouped as "Imported Works"
    expect(result.errors).toHaveLength(0);
    expect(result.workGroups).toHaveLength(1);
    expect(result.workGroups[0].tracks).toHaveLength(1);
    expect(result.workGroups[0].folderPath).toBe('__root__');
  });

  it('returns empty for non-existent path', async () => {
    const adapter = new LocalAdapter('test', testDir);
    const result = await scanLocalDirectory('nonexistent', adapter);

    expect(result.workGroups).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThanOrEqual(0);
  });
});
