# Milestone v6.0 Requirements

**Status:** Active (70% complete)
**Theme:** Real-Time Collaboration Infrastructure

## Requirements

### PartyKit Deployment (PK)
- [x] **PK-01**: Deploy PartyKit server to production with `npx partykit deploy` and validate WebSocket connectivity.
  - Deployed to `aresweb-partykit.thehomelessguy.partykit.dev`
- [x] **PK-02**: Create `document_snapshots` D1 migration for YDoc state persistence (room_id, state BLOB, updated_at).
  - Applied migration 0014, table added to schema.sql
- [ ] **PK-03**: Bind the deployed PartyKit D1 database to the ARES D1 instance for shared document state.
  - **DEFERRED** — Managed PartyKit doesn't support D1 bindings. Requires cloud-prem deployment. Moved to Phase 07-3.
- [x] **PK-04**: Set `VITE_PARTYKIT_HOST` in Cloudflare Pages environment variables for production builds.
  - Set via `.env.production` file, baked in at Vite build time

### Editor UI & Zulip Fixes (FIX) — Added mid-milestone
- [x] **FIX-01**: Replace full RichEditorToolbar with compact variant in TaskDetailsModal to fix toolbar covering content.
- [x] **FIX-02**: Auto-create Zulip threads for tasks without explicit stream/topic metadata.
- [x] **FIX-03**: Fix VersionHistorySidebar fetching from stale `/api/liveblocks/history/` URL — route each editor to its correct backend.
- [x] **FIX-04**: Attribute Zulip web replies to the authenticated user's nickname instead of the bot identity.

### Integration Verification (INT)
- [ ] **INT-01**: Verify that all four editor surfaces (Docs, Blog, Events, Tasks) display "Live" status badge when connected.
- [ ] **INT-02**: Test multi-user concurrent editing in at least one editor (two browser tabs editing the same document).
- [ ] **INT-03**: Validate that document changes persist across page reloads via D1 snapshot sync.

### Resilience (RES)
- [ ] **RES-01**: Confirm standalone fallback works when PartyKit server is unreachable (editor loads with "Offline" badge).
- [ ] **RES-02**: Add reconnection logic — if PartyKit recovers mid-session, attempt to re-sync without page reload.

### Deferred Items (from prior milestones)
- [ ] **DEF-01**: Media manager E2E testing (TEST-03 from v5.7).
- [ ] **DEF-02**: Usage metrics admin dashboard (MON-03 from v5.7).

### Noted for Investigation
- [ ] **INV-01**: Zulip account sync between aresfirst.org and Zulip — verify all team members have linked accounts.

## Out of Scope
- Presence avatars (cursor names/colors) — future milestone after base collab works.
- Conflict resolution UI — Yjs handles CRDT merges automatically.
- Custom PartyKit domain — use default `*.partykit.dev` domain initially.
