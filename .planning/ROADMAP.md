# Roadmap: ARESWEB

## Milestones

- ✅ **v6.1** — Deferred Items & Type Safety (Shipped 2026-05-04)
- 🚧 **v6.2** — Metrics, Testing & UI Polish (In Progress)

## Phases

### Phase 09: Media Manager E2E Testing
**Goal:** Deliver end-to-end Playwright test coverage for the media upload, deletion, and gallery viewing workflows to prevent future regressions.
**Requirements:** TEST-01
**Success Criteria:**
1. Playwright tests accurately simulate multipart/form-data image uploads
2. Tests cover R2 deletion and movement logic
3. CI/CD pipeline runs these tests without flake

### Phase 10: Usage Metrics Dashboard
**Goal:** Build an administrative dashboard interface to track and visualize platform usage metrics, such as daily active users and API latency.
**Requirements:** MON-01, MON-02
**Success Criteria:**
1. Admin panel includes a new "Metrics" or "Analytics" tab
2. Charts correctly aggregate system usage data
3. Access is strictly gated to administrative roles

### Phase 11: Sub-task UI Polish
**Goal:** Refine the Kanban and Task modal UI to elegantly render nested sub-tasks with clear visual hierarchies.
**Requirements:** TSK-01, TSK-02
**Success Criteria:**
1. Monday.com table view visually indents or groups sub-tasks under parents
2. TaskDetailsModal allows viewing, creating, and editing sub-tasks
3. Drag-and-drop ordering logic handles parent/child constraints without crashing

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 09. Media Manager E2E Testing | v6.2 | 1/1 | Completed | 2026-05-04 |
| 10. Usage Metrics Dashboard | v6.2 | 0/0 | Not started | - |
| 11. Sub-task UI Polish | v6.2 | 0/0 | Not started | - |

## Backlog

- **999.1** Investigate Zulip account email syncing mismatches
- **999.2** 3D Hardware Visualizer (RobotViewer) headless WebGL optimization
