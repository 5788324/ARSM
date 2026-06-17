# Metadata Provider Capabilities

## Supported Providers

### dlsite
- **Base URL**: `https://www.dlsite.com`
- **Query types**: URL, Code (RJxxxxxx)
- **Extraction method**: HTML regex parsing

| Field | Support | Notes |
|-------|---------|-------|
| displayTitle | ✅ | From `<title>` tag, first segment |
| originalTitle | ✅ | Full `<title>` content |
| workCode | ✅ | RJ/VJ/BJ patterns in title or page |
| circleName | ✅ | Multiple JP/EN patterns |
| description | ✅ | og:description + meta description |
| coverUrl | ✅ | og:image + twitter:image |
| releaseDate | ⚠️ | Best-effort from date patterns |
| tags | ⚠️ | Extracted from tag/category links |
| voiceActors | ⚠️ | Extracted from CV/声優 sections |
| tracks | ⚠️ | Table-based track list extraction |

### asmr.one
- **Base URL**: `https://asmr.one`
- **Query types**: URL, Code
- **Extraction method**: Same generic HTML parser

| Field | Support | Notes |
|-------|---------|-------|
| displayTitle | ✅ | Same parser |
| workCode | ✅ | Same parser |
| circleName | ⚠️ | Pattern match dependent on page structure |
| description | ✅ | Same parser |
| coverUrl | ✅ | Same parser |
| tags | ⚠️ | Dependent on site HTML structure |
| voiceActors | ⚠️ | Dependent on site HTML structure |
| tracks | ❌ | Track listing format unknown |

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Reliably extracted for typical pages |
| ⚠️ | Best-effort — may be empty depending on page structure |
| ❌ | Not supported |

## Limitations

1. **No JavaScript rendering**: The parser works on raw HTML only. Dynamic content loaded via JS will not be captured.
2. **Site-specific variance**: Extraction patterns are generic and may not work for all pages on a given site.
3. **No API integration**: Uses web scraping, not official APIs. Subject to site structure changes.
4. **Token limits**: Tags/actors/tracks are capped (15/10/30) to avoid excessive data.

## Adding a New Provider

1. Create a class extending `GenericMetadataProvider` or implementing `MetadataProvider`
2. Override `parseHtml()` with provider-specific extraction
3. Register with `registerProvider()`
4. Add a capabilities entry in this document
