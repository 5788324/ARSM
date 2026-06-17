import { MetadataProvider, WorkMetadata } from './types';

/**
 * GenericMetadataProvider — a template for web-scraping providers.
 *
 * In MVP, this uses a simple fetch + regex approach.
 * Real implementations should use provider-specific HTML parsing.
 */
export class GenericMetadataProvider implements MetadataProvider {
  readonly name: string;
  readonly supportedQueries: ('url' | 'code' | 'title')[] = ['url', 'code'];
  private baseUrl: string;

  constructor(name: string, baseUrl: string) {
    this.name = name;
    this.baseUrl = baseUrl;
  }

  async fetchByUrl(url: string): Promise<WorkMetadata> {
    const html = await this.fetchPage(url);
    return this.parseHtml(url, html);
  }

  async fetchByCode(code: string): Promise<WorkMetadata> {
    const url = `${this.baseUrl}/work/${encodeURIComponent(code)}`;
    return this.fetchByUrl(url);
  }

  async fetchByTitle(_title: string): Promise<WorkMetadata> {
    throw new Error('Title search not supported by this provider');
  }

  private async fetchPage(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ARSM/1.0 (private library; metadata fetcher)',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }

    return res.text();
  }

  /**
   * Parse HTML into WorkMetadata.
   * Override this in provider-specific implementations.
   */
  protected parseHtml(url: string, html: string): WorkMetadata {
    // Extract title from <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : 'Unknown Work';

    // Try to extract work code (e.g., RJ123456, VJ012345, BJ012345)
    const codeMatch = html.match(/\b(RJ|VJ|BJ)\d{4,}\b/i) || pageTitle.match(/\b(RJ|VJ|BJ)\d{4,}\b/i);

    // Description: try og:description, then meta description
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
    const description = ogDescMatch?.[1] || metaDescMatch?.[1];

    // Circle name: try multiple patterns
    const circlePatterns = [
      /サークル名?[：:]\s*<[^>]*>([^<]{2,40})<\/[^>]*>/i,
      /circle[^"'>]*["'\s]*>([^<]{2,40})<\/a>/i,
      /brand[^"'>]*["'\s]*>([^<]{2,40})<\/a>/i,
      /作者[：:]\s*<[^>]*>([^<]{2,40})<\/[^>]*>/i,
    ];
    let circleName: string | undefined;
    for (const pattern of circlePatterns) {
      const m = html.match(pattern);
      if (m) { circleName = m[1].trim(); break; }
    }

    // Cover image: og:image, then twitter:image, then first large img
    const coverMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);

    // Tags: extract from category/tag elements
    const tags: string[] = [];
    const tagPatterns = [
      /<a[^>]*href=["'][^"']*tag[^"']*["'][^>]*>([^<]{1,30})<\/a>/gi,
      /<a[^>]*href=["'][^"']*category[^"']*["'][^>]*>([^<]{1,30})<\/a>/gi,
      /<span[^>]*class=["'][^"']*tag[^"']*["'][^>]*>([^<]{1,30})<\/span>/gi,
    ];
    for (const pattern of tagPatterns) {
      let m;
      while ((m = pattern.exec(html)) !== null) {
        const tag = m[1].trim();
        if (tag && !tags.includes(tag) && tag.length < 30) tags.push(tag);
      }
    }

    // Voice actors: CV/voice actor patterns
    const voiceActors: string[] = [];
    const vaPatterns = [
      /CV[：:]\s*([^<\n]{2,100})/i,
      /声優[：:]\s*([^<\n]{2,100})/i,
      /出演[：:]\s*([^<\n]{2,100})/i,
      /<a[^>]*href=["'][^"']*voice[^"']*["'][^>]*>([^<]{2,30})<\/a>/gi,
    ];
    for (const pattern of vaPatterns) {
      if (pattern.flags.includes('g')) {
        let m;
        while ((m = pattern.exec(html)) !== null) {
          vaPatterns[3].lastIndex = m.index + 1;
          const name = m[1].trim();
          if (name && !voiceActors.includes(name) && name.length < 30) voiceActors.push(name);
        }
      } else {
        const m = html.match(pattern);
        if (m) {
          const names = m[1].split(/[,、,]/).map((s: string) => s.trim()).filter(Boolean);
          for (const name of names) {
            if (!voiceActors.includes(name) && name.length < 30) voiceActors.push(name);
          }
        }
      }
    }

    // Release date
    const datePatterns = [
      /販売日[：:]\s*(\d{4}[-/]\d{2}[-/]\d{2})/i,
      /発売日[：:]\s*(\d{4}[-/]\d{2}[-/]\d{2})/i,
      /release[^"'>]*["'\s]*>(\d{4}[-/]\d{2}[-/]\d{2})/i,
      /"releaseDate"\s*:\s*"(\d{4}-\d{2}-\d{2})"/i,
    ];
    let releaseDate: string | undefined;
    for (const pattern of datePatterns) {
      const m = html.match(pattern);
      if (m) { releaseDate = m[1]; break; }
    }

    // Track list: try track table patterns
    const tracks: { trackNumber: number; title: string; durationSec?: number }[] = [];
    const trackTableRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>(\d+)<\/td>[\s\S]*?<td[^>]*>([^<]{2,200})<\/td>/gi;
    let trackMatch;
    let trackNum = 1;
    while ((trackMatch = trackTableRegex.exec(html)) !== null) {
      tracks.push({
        trackNumber: parseInt(trackMatch[1], 10) || trackNum++,
        title: trackMatch[2].trim(),
      });
    }

    return {
      displayTitle: pageTitle.split(/[|｜-]/)[0].trim(),
      originalTitle: pageTitle,
      workCode: codeMatch ? codeMatch[0] : undefined,
      circleName,
      description,
      coverUrl: coverMatch ? coverMatch[1] : undefined,
      releaseDate,
      tags: tags.slice(0, 15),
      voiceActors: voiceActors.slice(0, 10),
      tracks: tracks.slice(0, 30),
      sourceSite: this.name,
      sourceUrl: url,
    };
  }
}

/** Registry of available metadata providers */
export const metadataProviders: Map<string, MetadataProvider> = new Map();

export function registerProvider(provider: MetadataProvider): void {
  metadataProviders.set(provider.name, provider);
}

export function getProvider(name: string): MetadataProvider | undefined {
  return metadataProviders.get(name);
}

// Register default providers
registerProvider(new GenericMetadataProvider('dlsite', 'https://www.dlsite.com'));
registerProvider(new GenericMetadataProvider('asmrone', 'https://asmr.one'));
