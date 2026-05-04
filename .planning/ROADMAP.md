# Roadmap: ARESWEB

## Milestones

- ✅ **v5.5** — Kanban, Science Corner & Recurring Events (Shipped 2026-05-02)
- ✅ **v5.6** — Stability & Polish (Shipped 2026-05-03)
- ✅ **v5.7** — Platform Maturity (Shipped 2026-05-03)
- ✅ [v5.8](milestones/v5.8-ROADMAP.md) — Feature Expansion (Shipped 2026-05-04)
- ✅ [v5.9](milestones/v5.9-ROADMAP.md) — Trello Parity & Zulip Sync (Shipped 2026-05-04)
- 🚧 **v6.0** — Real-Time Collaboration Infrastructure (Active)

## Phases

### Phase 06: PartyKit Production Deployment
**Goal:** Deploy the PartyKit Yjs collaboration server, create the D1 snapshot persistence table, and wire `VITE_PARTYKIT_HOST` into Cloudflare Pages.

**Requires:** PK-01, PK-02, PK-03, PK-04

**Plans:**
- [ ] 06-1: Create D1 migration for `document_snapshots` table
- [ ] 06-2: Deploy PartyKit server to production (`npx partykit deploy`)
- [ ] 06-3: Set `VITE_PARTYKIT_HOST` environment variable in Cloudflare Pages

---

### Phase 07: Integration Verification & Resilience
**Goal:** Validate real-time collaboration across all editor surfaces and add reconnection logic.

**Requires:** INT-01, INT-02, INT-03, RES-01, RES-02
**Depends on:** Phase 06

**Plans:**
- [ ] 07-1: Multi-tab collab testing across Docs/Blog/Events/Tasks editors
- [ ] 07-2: D1 snapshot persistence verification (edit → reload → verify)
- [ ] 07-3: Standalone fallback and reconnection resilience testing
