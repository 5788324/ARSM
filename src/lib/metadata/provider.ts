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

    // Try to extract work code (e.g., RJ123456)
    const codeMatch = html.match(/(RJ|VJ|BJ)\d{4,}/i) || pageTitle.match(/(RJ|VJ|BJ)\d{4,}/i);

    // Try to extract description from meta tags
    const descMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    );

    // Try to extract circle name
    const circleMatch =
      html.match(/circle["'\s:]+([^<"'\n]{2,40})<\/a>/i) ||
      html.match(/サークル[：:]\s*([^<"\n]{2,40})/i);

    // Try to extract cover image
    const coverMatch = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    );

    return {
      displayTitle: pageTitle.split('|')[0].split('-')[0].trim(),
      originalTitle: pageTitle,
      workCode: codeMatch ? codeMatch[0] : undefined,
      circleName: circleMatch ? circleMatch[1].trim() : undefined,
      description: descMatch ? descMatch[1].trim() : undefined,
      coverUrl: coverMatch ? coverMatch[1] : undefined,
      tags: [],
      voiceActors: [],
      tracks: [],
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
