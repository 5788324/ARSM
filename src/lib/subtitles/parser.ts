export interface SubtitleCue {
  start: number; // seconds
  end: number;   // seconds
  text: string;
}

/** Parse subtitle text into timed cues. Returns null if no timing found. */
export function parseSubtitle(text: string, kind: string): SubtitleCue[] | null {
  switch (kind) {
    case 'srt': return parseSrt(text);
    case 'vtt': return parseVtt(text);
    case 'lrc': return parseLrc(text);
    default: return null; // txt, pdf — plain text, no timing
  }
}

function parseSrt(text: string): SubtitleCue[] | null {
  const cues: SubtitleCue[] = [];
  const blocks = text.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;
    const timeMatch = lines[1]?.match(/(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})/);
    if (!timeMatch) continue;
    cues.push({ start: parseSrtTime(timeMatch[1]), end: parseSrtTime(timeMatch[2]), text: lines.slice(2).join('\n').trim() });
  }
  return cues.length > 0 ? cues : null;
}

function parseSrtTime(t: string): number {
  const [h, m, sec] = t.split(':');
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(sec.replace(',', '.'));
}

function parseVtt(text: string): SubtitleCue[] | null {
  const cues: SubtitleCue[] = [];
  const lines = text.split('\n');
  let i = 0;
  while (i < lines.length && !lines[i]?.includes('-->')) i++; // skip header
  for (; i < lines.length; i++) {
    const match = lines[i]?.match(/([\d:.]+)\s*-->\s*([\d:.]+)/);
    if (!match) continue;
    const textLines: string[] = [];
    i++;
    while (i < lines.length && lines[i]?.trim() && !lines[i].includes('-->')) { textLines.push(lines[i]); i++; }
    i--;
    cues.push({ start: parseVttTime(match[1]), end: parseVttTime(match[2]), text: textLines.join('\n').trim() });
  }
  return cues.length > 0 ? cues : null;
}

function parseVttTime(t: string): number {
  const parts = t.split(':');
  if (parts.length === 3) return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
}

function parseLrc(text: string): SubtitleCue[] | null {
  const cues: SubtitleCue[] = [];
  const tagRe = /\[(\d{2}):(\d{2})(?:[.:](\d{2,3}))?\]/g;
  const lines = text.split('\n');
  for (const line of lines) {
    const tags: { min: number; sec: number }[] = [];
    let m;
    while ((m = tagRe.exec(line)) !== null) {
      tags.push({ min: parseInt(m[1]), sec: parseInt(m[2]) + (m[3] ? parseInt(m[3]) / (m[3].length === 3 ? 1000 : 100) : 0) });
    }
    if (tags.length === 0) continue;
    const plain = line.replace(tagRe, '').trim();
    if (!plain) continue;
    for (const tag of tags) {
      cues.push({ start: tag.min * 60 + tag.sec, end: tag.min * 60 + tag.sec + 5, text: plain });
    }
  }
  cues.sort((a, b) => a.start - b.start);
  return cues.length > 0 ? cues : null;
}

/** Find the active cue index for a given time in seconds. */
export function findActiveCue(cues: SubtitleCue[], time: number): number {
  let lo = 0, hi = cues.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= time && cues[mid].end >= time) return mid;
    if (cues[mid].start > time) hi = mid - 1;
    else lo = mid + 1;
  }
  return -1;
}
