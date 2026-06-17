# Repository Capability Matrix

## Supported Operations by Repository Type

| Operation | Local | OpenList | WebDAV |
|-----------|-------|----------|--------|
| List files | ✅ | ⚠️ Experimental | ⚠️ Experimental |
| Check existence | ✅ | ✅ | ✅ |
| File metadata | ✅ | ✅ | ✅ |
| Stream audio | ✅ | ⚠️ Experimental | ⚠️ Experimental |
| Serve covers | ✅ | ⚠️ Experimental | ⚠️ Experimental |
| Import scan | ✅ | ❌ | ❌ |
| Health check | ✅ | ⚠️ Experimental | ⚠️ Experimental |

✅ = Supported and tested
⚠️ = Adapter implemented but not validated in real environment
❌ = Not supported

## Notes

### Local
- Full support for all operations
- Uses Node.js `fs` module
- Import scanner uses ffprobe for metadata extraction
- Paths stored as repository-relative

### OpenList (Experimental)
- Adapter implements HTTP REST + WebDAV PROPFIND fallback
- Requires real OpenList instance for validation
- Authentication via Bearer token
- Mount path mapping not yet implemented
- Known limitations:
  - `/api/files` endpoint behavior is assumed, not verified
  - PROPFIND XML parsing is minimal — may not handle all responses
  - No directory listing pagination

### WebDAV (Experimental)
- Extends OpenListAdapter with WebDAV-specific type
- PROPFIND-based file listing
- HEAD-based metadata and existence checks
- Known limitations:
  - Same as OpenList limitations above
  - No WebDAV-specific authentication schemes beyond Bearer token

## Validation Requirements

Before marking OpenList/WebDAV as fully supported:

1. Test against a real running OpenList instance
2. Verify repository creation and health check
3. Verify file listing returns correct entries
4. Verify metadata lookup returns correct mime types and sizes
5. Verify audio streaming through the ARSM proxy
6. Verify cover image serving
7. Test with at least one mounted media source

## Path Normalization Rules

- All file paths stored in the database are repository-relative
- Local paths are joined with repository rootPath at access time
- Remote paths are joined with repository base URL
- Cover images are served through `/api/covers/[workId]` to abstract repository type
- Track streaming uses `/api/tracks/[trackId]/stream` with adapter-based resolution
