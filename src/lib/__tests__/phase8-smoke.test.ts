import { describe, it, expect } from 'vitest';
import { searchWorks } from '@/lib/works/search-service';

// This test verifies the search service query building logic.
// It requires a running Prisma/DB — skip if not available.
describe('searchWorks', () => {
  it('builds keyword query', async () => {
    // Verify the function runs without error with basic params
    const result = await searchWorks({ keyword: 'TEST_NONEXISTENT', pageSize: 1 });
    expect(result).toHaveProperty('works');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('totalPages');
    expect(Array.isArray(result.works)).toBe(true);
    expect(result.total).toBe(0);
  });

  it('respects pageSize', async () => {
    const result = await searchWorks({ pageSize: 5, sort: 'recent' });
    expect(result.pageSize).toBe(5);
  });

  it('handles empty query', async () => {
    const result = await searchWorks({});
    expect(result.totalPages).toBeGreaterThanOrEqual(0);
  });
});

describe('subtitle parser exports', () => {
  it('parseSubtitle is callable', async () => {
    const { parseSubtitle } = await import('@/lib/subtitles/parser');
    expect(typeof parseSubtitle).toBe('function');
  });

  it('findActiveCue is callable', async () => {
    const { findActiveCue } = await import('@/lib/subtitles/parser');
    expect(typeof findActiveCue).toBe('function');
  });
});
