# Roadmap: ARESWEB

## Milestones

- ✅ **v5.5** — Kanban, Science Corner & Recurring Events (Shipped 2026-05-02)
- ✅ **v5.6** — Stability & Polish (Shipped 2026-05-03)
- ✅ **v5.7** — Platform Maturity (Shipped 2026-05-03)
- ✅ **v5.8** — Feature Expansion (Shipped 2026-05-04)
- 🚧 **v5.9** — Trello Parity & Zulip Sync (In Progress)

## Phases

### Phase 5: Trello Parity & Zulip Sync
**Goal:** Map Kanban tasks to Zulip topics and embed collaborative descriptions
- [ ] TASK-01: Update database schema and migrations
- [ ] TASK-02: Backend API updates for Zulip topic creation
- [ ] TASK-03: Enhance ZulipThread with a message composer
- [ ] TASK-04: Implement TaskDetailsModal with embedded PartyKit Editor and Zulip Thread

### Phase 1: Recurring GCal Sync
**Goal:** Establish bidirectional sync for recurring events
- [x] SYNC-01: Implement recurrence rule parsing
- [x] SYNC-02: Enhance /admin/sync for recurring instances

### Phase 2: Admin Pagination
**Goal:** Handle large datasets gracefully
- [x] ADMIN-01: Cursor pagination for Users table
- [x] ADMIN-02: Cursor pagination for Events table

### ✅ Phase 3: Analytics & Monitoring
**Goal:** Error tracking & observability
- [x] MON-01: Sentry integration
- [x] MON-02: API latency logging
- [x] MON-03: Usage metrics dashboard

### ✅ Phase 4: PartyKit Realtime Migration
**Goal:** Migrate collaborative editing from Liveblocks to self-hosted PartyKit
- [x] PKIT-01: Scaffold PartyKit standalone worker & Yjs DO setup
- [x] PKIT-02: Replace `@liveblocks/yjs` with `y-partykit` in frontend
- [x] PKIT-03: Implement Tiptap provider & auth mechanisms
- [x] PKIT-04: Adapt snapshot persistence to D1 directly via PartyKit
- [x] PKIT-05: Remove Liveblocks dependencies and webhooks
