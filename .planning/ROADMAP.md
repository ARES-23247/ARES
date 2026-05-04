# Roadmap: ARESWEB

## Milestones

- ✅ **v5.5** — Kanban, Science Corner & Recurring Events (Shipped 2026-05-02)
- ✅ **v5.6** — Stability & Polish (Shipped 2026-05-03)
- ✅ **v5.7** — Platform Maturity (Shipped 2026-05-03)
- ✅ [v5.8](milestones/v5.8-ROADMAP.md) — Feature Expansion (Shipped 2026-05-04)
- ✅ [v5.9](milestones/v5.9-ROADMAP.md) — Trello Parity & Zulip Sync (Shipped 2026-05-04)
- 🚧 **v6.0** — Real-Time Collaboration Infrastructure (Active)

## Phases

### Phase 07: Integration Verification & Resilience
**Goal:** Validate real-time collaboration across all editor surfaces and add reconnection logic.

**Requires:** INT-01, INT-02, INT-03, RES-01, RES-02
**Depends on:** Phase 06

**Plans:** 3 plans
- [ ] 07-01: Multi-user Playwright tests for collaboration (INT-01/02/03)
- [ ] 07-02: Reconnection logic with exponential backoff (RES-01/02)
- [ ] 07-03: Cloud-prem PartyKit deployment with D1 persistence (PK-03)
