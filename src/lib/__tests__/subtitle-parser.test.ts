import { describe, it, expect } from 'vitest';
import { parseSubtitle, findActiveCue, SubtitleCue } from '@/lib/subtitles/parser';

const srtSample = `1
00:00:01,000 --> 00:00:03,500
Hello world

2
00:00:05,000 --> 00:00:08,000
Second line`;

const vttSample = `WEBVTT

00:00:01.000 --> 00:00:03.500
Hello world

00:00:05.000 --> 00:00:08.000
Second line`;

const lrcSample = `[ti:Title]
[00:01.00]First line
[00:05.50]Second line
[00:10.00]Third`;

const txtSample = 'Just plain text\nno timing here';

describe('parseSubtitle', () => {
  it('parses SRT', () => {
    const result = parseSubtitle(srtSample, 'srt');
    expect(result).not.toBeNull();
    expect(result!.length).toBe(2);
    expect(result![0]).toEqual({ start: 1, end: 3.5, text: 'Hello world' });
    expect(result![1]).toEqual({ start: 5, end: 8, text: 'Second line' });
  });

  it('parses VTT', () => {
    const result = parseSubtitle(vttSample, 'vtt');
    expect(result).not.toBeNull();
    expect(result!.length).toBe(2);
    expect(result![0].start).toBeCloseTo(1, 0);
    expect(result![0].text).toBe('Hello world');
  });

  it('parses LRC', () => {
    const result = parseSubtitle(lrcSample, 'lrc');
    expect(result).not.toBeNull();
    expect(result!.length).toBe(3);
    expect(result![0].start).toBeCloseTo(1, 0);
    expect(result![0].text).toBe('First line');
  });

  it('returns null for plain text', () => {
    const result = parseSubtitle(txtSample, 'txt');
    expect(result).toBeNull();
  });

  it('returns null for pdf', () => {
    const result = parseSubtitle('whatever', 'pdf');
    expect(result).toBeNull();
  });
});

describe('findActiveCue', () => {
  const cues: SubtitleCue[] = [
    { start: 0, end: 5, text: 'A' },
    { start: 5, end: 10, text: 'B' },
    { start: 10, end: 15, text: 'C' },
  ];

  it('finds active cue during playback', () => {
    expect(findActiveCue(cues, 2.5)).toBe(0);
    expect(findActiveCue(cues, 7)).toBe(1);
    expect(findActiveCue(cues, 12)).toBe(2);
  });

  it('returns -1 when no cue matches', () => {
    expect(findActiveCue(cues, 20)).toBe(-1);
    expect(findActiveCue(cues, -1)).toBe(-1);
  });

  it('handles empty array', () => {
    expect(findActiveCue([], 5)).toBe(-1);
  });
});
