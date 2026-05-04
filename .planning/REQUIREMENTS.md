# Milestone v6.0 Requirements

**Status:** Active
**Theme:** Real-Time Collaboration Infrastructure

## Requirements

### PartyKit Deployment (PK)
- [ ] **PK-01**: Deploy PartyKit server to production with `npx partykit deploy` and validate WebSocket connectivity.
- [ ] **PK-02**: Create `document_snapshots` D1 migration for YDoc state persistence (room_id, state BLOB, updated_at).
- [ ] **PK-03**: Bind the deployed PartyKit D1 database to the ARES D1 instance for shared document state.
- [ ] **PK-04**: Set `VITE_PARTYKIT_HOST` in Cloudflare Pages environment variables for production builds.

### Integration Verification (INT)
- [ ] **INT-01**: Verify that all four editor surfaces (Docs, Blog, Events, Tasks) display "Live" status badge when connected.
- [ ] **INT-02**: Test multi-user concurrent editing in at least one editor (two browser tabs editing the same document).
- [ ] **INT-03**: Validate that document changes persist across page reloads via D1 snapshot sync.

### Resilience (RES)
- [ ] **RES-01**: Confirm standalone fallback works when PartyKit server is unreachable (editor loads with "Offline" badge).
- [ ] **RES-02**: Add reconnection logic — if PartyKit recovers mid-session, attempt to re-sync without page reload.

### Deferred Items (from v5.9)
- [ ] **DEF-01**: Media manager E2E testing (TEST-03 from v5.7).
- [ ] **DEF-02**: Usage metrics admin dashboard (MON-03 from v5.7).

## Out of Scope
- Presence avatars (cursor names/colors) — future milestone after base collab works.
- Conflict resolution UI — Yjs handles CRDT merges automatically.
- Custom PartyKit domain — use default `*.partykit.dev` domain initially.
