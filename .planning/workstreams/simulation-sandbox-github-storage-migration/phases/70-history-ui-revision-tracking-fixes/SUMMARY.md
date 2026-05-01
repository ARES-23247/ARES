# Summary: 70-01
## History UI and Revision Persistence

**Goal:** Resolve z-index overlap for the VersionHistorySidebar and ensure manual snapshot persistence.
**Status:** COMPLETE

- Ported `VersionHistorySidebar.tsx` to `createPortal`.
- Handled AST json via headless Tiptap preview `ReadOnlyPreview`.
- `DebouncedNotesArea` active in `AdminInquiries.tsx`.
- DB queries added to docs/posts/events to write into `document_history`.
