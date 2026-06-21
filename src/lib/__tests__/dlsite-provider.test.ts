import { describe, it, expect } from 'vitest';
import { DLsiteProvider } from '@/lib/acquisition/providers/dlsite';

describe('DLsiteProvider', () => {
  const provider = new DLsiteProvider();

  it('has correct id and display name', () => {
    expect(provider.id).toBe('dlsite');
    expect(provider.displayName).toContain('DLsite');
  });

  it('canDownload is false', () => {
    expect(provider.canDownload).toBe(false);
  });

  it('supports RJ format (6+ digits)', () => {
    expect(provider.supports('RJ123456')).toBe(true);
    expect(provider.supports('RJ01593868')).toBe(true);
  });

  it('rejects BJ/VJ codes', () => {
    expect(provider.supports('BJ123456')).toBe(false);
    expect(provider.supports('VJ123456')).toBe(false);
  });

  it('rejects invalid input', () => {
    expect(provider.supports('')).toBe(false);
    expect(provider.supports('abc')).toBe(false);
    expect(provider.supports('RJ123')).toBe(false); // too short
  });

  it('inspect returns fallback on network error', async () => {
    // Will likely fail network call, should return fallback
    const result = await provider.inspect('RJ999999');
    expect(result.sourceId).toBe('RJ999999');
    expect(result.files).toEqual([]);
    expect(result.metadata).toBeDefined();
  });

  it('download returns empty summary with error', async () => {
    const result = await provider.download('RJ123456', '/tmp');
    expect(result.total).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('尚未支持');
  });
});
