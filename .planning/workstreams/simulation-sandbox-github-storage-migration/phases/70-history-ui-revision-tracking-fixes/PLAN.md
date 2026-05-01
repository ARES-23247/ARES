# Plan: 70-01
## History UI and Revision Persistence

**Goal:** Resolve z-index overlap for the VersionHistorySidebar and ensure manual snapshot persistence.
**Status:** COMPLETE

1. Migrate `VersionHistorySidebar.tsx` to `createPortal`.
2. Replace `dangerouslySetInnerHTML` with `ReadOnlyPreview`.
3. Add `DebouncedNotesArea` to `AdminInquiries.tsx`.
4. Add `document_history` snapshots to `docs.ts`, `posts.ts`, and `events.ts`.
