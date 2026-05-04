# Roadmap: ARESWEB

## Milestones

- ✅ **v5.5** — Kanban, Science Corner & Recurring Events (Shipped 2026-05-02)
- ✅ **v5.6** — Stability & Polish (Shipped 2026-05-03)
- ✅ **v5.7** — Platform Maturity (Shipped 2026-05-03)
- ✅ [v5.8](milestones/v5.8-ROADMAP.md) — Feature Expansion (Shipped 2026-05-04)
- ✅ [v5.9](milestones/v5.9-ROADMAP.md) — Trello Parity & Zulip Sync (Shipped 2026-05-04)
- 🚧 **v6.0** — Real-Time Collaboration Infrastructure (Active)

## Phases

### Phase 06: PartyKit Production Deployment ✅
**Goal:** Deploy the PartyKit Yjs collaboration server and wire `VITE_PARTYKIT_HOST` into Cloudflare Pages.

**Requires:** PK-01, PK-02, PK-04

**Plans:**
- [x] 06-1: Create D1 migration for `document_snapshots` table
- [x] 06-2: Deploy PartyKit server to production (`npx partykit deploy`)
- [x] 06-3: Set `VITE_PARTYKIT_HOST` environment variable via `.env.production`

---

### Phase 06.5: Editor UI & Zulip Fixes ✅
**Goal:** Fix editor toolbar overlap in TaskDetailsModal, auto-create Zulip threads, fix version history, and attribute Zulip replies to actual users.

**Plans:**
- [x] 06.5-1: Replace full RichEditorToolbar with CompactEditorToolbar in TaskDetailsModal
- [x] 06.5-2: Auto-initialize Zulip thread for tasks without explicit stream/topic
- [x] 06.5-3: Fix VersionHistorySidebar using stale /api/liveblocks/history URL
- [x] 06.5-4: Attribute Zulip web replies to logged-in user instead of bot

---

### Phase 07: Integration Verification & Resilience
**Goal:** Validate real-time collaboration across all editor surfaces and add reconnection logic.

**Requires:** INT-01, INT-02, INT-03, RES-01, RES-02
**Depends on:** Phase 06

**Plans:**
- [ ] 07-1: Multi-tab collab testing across Docs/Blog/Events/Tasks editors
- [ ] 07-2: Standalone fallback and reconnection resilience testing
- [ ] 07-3: D1 cloud-prem deployment for PartyKit snapshot persistence (PK-03 deferred)
