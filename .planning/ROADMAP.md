# Roadmap: ARESWEB

## Milestones

- ✅ **v6.1** — Deferred Items & Type Safety (Shipped 2026-05-04)
- ✅ **v6.2** — Metrics, Testing & UI Polish (Shipped 2026-05-04)
- ✅ **v6.3** — Outreach & Impact Logging Restoration (Shipped 2026-05-04)
- 🚧 **v6.4** — Science & Math Corner Expansion (In Progress)

## Phases

<details>
<summary>✅ v6.3 Outreach & Impact Logging Restoration (Phases 12-13) — SHIPPED 2026-05-04</summary>

- [x] Phase 12: Outreach & Impact Logging Fixes (1 plans) — completed 2026-05-04
- [x] Phase 13: Interactive Tools Foundation (2 plans) — completed 2026-05-04

</details>

### 🚧 v6.4 Science & Math Corner Expansion (In Progress)

- [x] Phase 14: Data Schema & Document Editor Updates (1 plans)
- [x] Phase 15: Math Corner Foundation & Hub Integrations (2 plans)
- [ ] Phase 16: Save AI Scouting Analyses (1 plans)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 12. Outreach & Impact Logging Fixes | v6.3 | 1/1 | Complete | 2026-05-04 |
| 13. Interactive Tools Foundation | v6.3 | 2/2 | Complete | 2026-05-04 |
| 14. Data Schema & Document Editor Updates | v6.4 | 1/1 | Complete | 2026-05-04 |
| 15. Math Corner Foundation & Hub Integrations | v6.4 | 2/2 | Complete | 2026-05-04 |

## Phase Details

### Phase 14: Data Schema & Document Editor Updates
**Goal:** Update the D1 database schema and Document Editor UI to support visibility checkboxes.
**Requirements:** DOCS-01, DOCS-02
**Success criteria:**
1. Database migration executed adding `display_in_areslib`, `display_in_math_corner`, and `display_in_science_corner` boolean columns.
2. Document Editor UI includes the 3 checkboxes for authors.
3. API successfully persists visibility flag changes to the D1 database.

### Phase 15: Math Corner Foundation & Hub Integrations
**Goal:** Build the Math Corner UI and integrate dynamic document fetching across all three hubs.
**Requirements:** MATH-01, MATH-02, SCI-01, ARES-01
**Success criteria:**
1. Math Corner page exists and is accessible via navigation, styled consistently with Science Corner.
2. Math Corner dynamically fetches and renders documents with `display_in_math_corner`.
3. Science Corner dynamically fetches and renders documents with `display_in_science_corner`.
4. Areslib dynamically fetches and renders documents with `display_in_areslib`.
5. A single document can successfully appear in multiple hubs simultaneously.

### Phase 16: Save AI Scouting Analyses
**Goal:** Implement persistence for AI scouting analyses so previous results can be retrieved without regenerating.
**Requirements:** None explicitly defined in requirements yet.
**Success criteria:**
1. Database migration creates `scouting_analyses` table.
2. Analytics API endpoint allows saving and fetching.
3. UI presents saved analyses as viewable history cards.

## Backlog

- [999.1] Investigation of Zulip account email syncing
- [999.2] 3D Hardware Visualizer (RobotViewer) headless WebGL optimization
