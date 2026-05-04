# Phase 07: Integration Verification & Resilience - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase validates the PartyKit real-time collaboration system deployed in Phase 06 and adds resilience for network instability. It covers:
- Integration verification (INT-01/02/03): Confirm "Live" status works, multi-user editing syncs, changes persist across reloads
- Resilience (RES-01/02): Verify offline fallback works, add reconnection logic
- Cloud-prem deployment (PK-03): Enable D1 snapshot persistence via non-managed PartyKit

**Four editors use PartyKit:** BlogEditor, DocsEditor, EventEditor, TaskDetailsModal

</domain>

<decisions>
## Implementation Decisions

### Test Automation (INT-01, INT-02, INT-03)
- **D-01:** Use full Playwright multi-user testing with `browser.context()` for simulating multiple users
- Implement tests for:
  - INT-01: All 4 editors display "Live" badge when connected
  - INT-02: Multi-tab concurrent editing syncs correctly
  - INT-03: Document changes persist across page reloads via D1 snapshot

### Reconnection Strategy (RES-02)
- **D-02:** Exponential backoff reconnection: 5s → 10s → 20s → 40s → 60s max
- **D-03:** Maximum 5 reconnection attempts before giving up
- **D-04:** After max attempts, show a manual "Reconnect" button in the Offline badge
- **D-05:** On successful reconnect, auto-sync any local changes without user prompt

### Cloud-Prem Deployment (PK-03)
- **D-06:** Deploy PartyKit as a Cloudflare Worker with D1 binding
- Keeps infrastructure consistent with main app (no separate Docker server needed)
- Enables shared `document_snapshots` table for cross-session persistence

### Offline UX Behavior (RES-01)
- **D-07:** When Offline, users can continue editing with a "Changes not saved" indicator
- **D-08:** Changes are stored locally and auto-sync on reconnect
- **D-09:** Use Yjs CRDT automatic merge for conflicts — no conflict resolution UI needed

### Claude's Discretion
- Exact Playwright test structure (how to simulate multiple users in same test file)
- Reconnection UI styling within existing badge design
- D1 migration details for cloud-prem PartyKit deployment

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PartyKit Integration
- `src/components/editor/CollaborativeEditorRoom.tsx` — Current PartyKit provider with 5s timeout and Live/Offline badges
- `src/components/BlogEditor.tsx` — Example of editor using CollaborativeEditorRoom
- `src/components/DocsEditor.tsx` — Docs editor using collaboration
- `src/components/EventEditor.tsx` — Event editor using collaboration
- `src/components/kanban/TaskDetailsModal.tsx` — Task modal with collaborative editing

### Testing Infrastructure
- `.planning/codebase/TESTING.md` — Project testing conventions (Vitest, Playwright, coverage thresholds)
- `tests/e2e/` — Existing E2E test patterns for reference

### Requirements
- `.planning/REQUIREMENTS.md` — Phase 07 requirements (INT-01/02/03, RES-01/02, PK-03)
- `.planning/ROADMAP.md` — Phase 07 plans and milestone context

### Database
- `schema.sql` — D1 schema including `document_snapshots` table (migration 0014)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CollaborativeEditorRoom.tsx` — Has `StatusBadge` component that shows Live/Offline state
- `YPartyKitProvider` from `y-partykit/provider` — PartyKit integration library
- Current timeout: `CONNECT_TIMEOUT_MS = 5000` (5 seconds)
- Playwright bypass: `__PLAYWRIGHT_TEST__` flag already exists for test skipping

### Established Patterns
- PartyKit host from `import.meta.env.VITE_PARTYKIT_HOST`
- React hooks for provider state (`useCollaborativeEditor`)
- Manual test bypass pattern exists for Playwright

### Integration Points
- 4 editors wrap content with `CollaborativeEditorRoom`
- Status badge positioning: `absolute top-2 right-2 z-10`
- Connection state managed via provider's `synced` event

</code_context>

<specifics>
## Specific Ideas

- Reconnection button should appear in the Offline badge after 5 failed attempts
- Playwright multi-user: use `browser.newContext()` to create separate browser contexts, then open pages in each
- Exponential backoff: 5s → 10s → 20s → 40s → 60s, then stop and show manual reconnect
- Cloudflare Workers deployment: use `wrangler pages deployment` or equivalent for PartyKit Worker

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-integration-verification-resilience*
*Context gathered: 2026-05-04*
