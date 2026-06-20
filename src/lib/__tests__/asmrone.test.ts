import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { normalizeId, flattenNodes, downloadFileStream } from '@/lib/acquisition/providers/asmrone';
import { mkdirSync, rmSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('normalizeId', () => {
  it('parses standard RJ codes', () => {
    expect(normalizeId('RJ01538000')).toEqual({ sourceId: 'RJ01538000', workId: '01538000' });
    expect(normalizeId('rj01538000')).toEqual({ sourceId: 'RJ01538000', workId: '01538000' });
    expect(normalizeId('  RJ01538000  ')).toEqual({ sourceId: 'RJ01538000', workId: '01538000' });
  });

  it('parses VJ and BJ codes', () => {
    expect(normalizeId('VJ012345')).toEqual({ sourceId: 'VJ012345', workId: '012345' });
    expect(normalizeId('BJ987654')).toEqual({ sourceId: 'BJ987654', workId: '987654' });
  });

  it('extracts code from URLs', () => {
    expect(normalizeId('https://asmr.one/work/RJ01538000')).toEqual({
      sourceId: 'RJ01538000', workId: '01538000',
    });
  });

  it('rejects invalid input', () => {
    expect(() => normalizeId('')).toThrow();
    expect(() => normalizeId('hello')).toThrow();
    expect(() => normalizeId('12345')).toThrow();
    expect(() => normalizeId('RJ12345')).toThrow();
  });

  it('rejects unknown prefixes', () => {
    expect(() => normalizeId('XX123456')).toThrow();
  });
});

describe('flattenNodes', () => {
  it('flattens nested folder structure', () => {
    const nodes = [
      { title: 'Folder1', type: 'folder', children: [
        { title: '01-track.mp3', type: 'audio', size: 1000, hash: 'abc', mediaDownloadUrl: 'http://x.com/1.mp3', mediaStreamUrl: '', streamLowQualityUrl: '' },
        { title: '02-track.flac', type: 'audio', size: 2000, hash: 'def', mediaDownloadUrl: 'http://x.com/2.flac', mediaStreamUrl: '', streamLowQualityUrl: '' },
      ]},
      { title: 'cover.jpg', type: 'image', size: 500, hash: 'ghi', mediaDownloadUrl: 'http://x.com/cover.jpg', mediaStreamUrl: '', streamLowQualityUrl: '' },
    ];

    const result = flattenNodes(nodes);
    expect(result).toHaveLength(3);
    expect(result[0].path).toBe('Folder1/01-track.mp3');
    expect(result[1].path).toBe('Folder1/02-track.flac');
    expect(result[2].path).toBe('cover.jpg');
  });

  it('handles empty input', () => {
    expect(flattenNodes([])).toEqual([]);
  });

  it('handles deeply nested folders', () => {
    const nodes = [
      { title: 'A', type: 'folder', children: [
        { title: 'B', type: 'folder', children: [
          { title: 'file.mp3', type: 'audio', size: 100, hash: 'x', mediaDownloadUrl: 'http://x.com/f.mp3', mediaStreamUrl: '', streamLowQualityUrl: '' },
        ]},
      ]},
    ];
    const result = flattenNodes(nodes);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('A/B/file.mp3');
  });

  it('handles nodes with missing optional fields', () => {
    const nodes = [{ title: '', type: 'audio' }];
    const result = flattenNodes(nodes);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('');
    expect(result[0].size).toBe(0);
    expect(result[0].downloadUrl).toBe('');
  });
});

describe('downloadFileStream', () => {
  const testDir = join(tmpdir(), 'arsm-dl-test-' + Date.now());

  beforeAll(() => { mkdirSync(testDir, { recursive: true }); });
  afterAll(() => { try { rmSync(testDir, { recursive: true, force: true }); } catch {} });

  it('streams data to disk without buffering in memory', async () => {
    const testData = Buffer.from('hello streaming world! '.repeat(100));
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(testData);
        controller.close();
      },
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: readable,
    });

    const destPath = join(testDir, 'streamed.bin');
    await downloadFileStream('http://mock/stream', destPath);

    expect(existsSync(destPath)).toBe(true);
    const stat = statSync(destPath);
    expect(stat.size).toBe(testData.length);
  });
});
