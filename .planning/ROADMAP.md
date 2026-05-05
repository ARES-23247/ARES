# Milestone Roadmap

## Current Overview

- 🎯 **Goal:** TBD
- 🛑 **Blockers:** None
- 🚧 **v6.6** — TypeScript Strictness (Active)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 21 | v6.6 | 1/1 | ✅ Done | 2026-05-05 |
| 22 | v6.6 | 1/1 | Complete | 2026-05-05 |
| 23 | v6.6 | 0/1 | Pending | - |
| 24 | v6.6 | 0/1 | Pending | - |
| 25 | v6.6 | 1/1 | ✅ Done | 2026-05-04 |
| 26 | v6.6 | 1/1 | ✅ Done | 2026-05-05 |

## Phase Details

### Phase 21: Core Domain & Data Layer Strictness
**Goal:** Audit and strictly type all Cloudflare D1/KV bindings, Hono API routes, and shared utilities.
**Status:** Active

### Phase 22: ARES Physics & Math Engine Validation
**Goal:** Provide explicit struct definitions for physics engines (Dyn4j, Matter.js) and generic math visualizers.
**Status:** Pending

### Phase 23: React Three Fiber (R3F) & Sim Component Typings
**Goal:** Strictly type React context providers, 3D meshes, refs, and simulation component props.
**Status:** Pending

### Phase 24: ESLint Lockdown & CI Validation
**Goal:** Enable `@typescript-eslint/no-explicit-any` globally and validate types via TSC without bypassing.
**Status:** Pending

### Phase 25: Comprehensive Security Audit
**Goal:** Conduct full security audit across API routes, frontend, authentication, simulation, and data validation layers.
**Status:** ✅ Done
**Completed:** 2026-05-04
**Summary:** 137 security issues resolved across two audit rounds using parallel AI agents. Fixed SQL injection, XSS vulnerabilities, authentication gaps, input validation, and rate limiting. Created 11 new utility files for sanitization, logging, and security.

### Phase 26: Calendar & Event Editor Enhancements
**Goal:** Add quick-add modal to calendar, replace native selects with searchable combobox, fix collaborative editing, and update E2E tests.
**Status:** ✅ Done
**Completed:** 2026-05-05
**Commits:** `45df07f`, `d59542d`, `cca8dc5`, `88e13ae`, `06f1ca0`, `5ce99b4`, `7add4e2`, `e760fe7`
**Summary:**
- Created `QuickAddEventModal` with pre-filled date/times, category selector, and keyboard accessibility
- Built `LocationCombobox` using HeadlessUI, replacing native `<select>` in both event forms
- Integrated `CreateLocationModal` for inline venue creation
- Fixed PartyKit WebSocket connection (removed incorrect `/party` suffix)
- Updated E2E tests for combobox interactions

---

### Archived Milestones

- [**v6.5** — Zulip Sync & Social Media Formalization](./milestones/v6.5-ROADMAP.md) (Completed: 2026-05-04)
- [**v6.4** — Web App Architecture](./milestones/v6.4-ROADMAP.md) (Completed: 2026-04-20)
- [**v6.2** — Frontend Upgrades](./milestones/v6.2-ROADMAP.md) (Completed: 2026-04-05)
- [**v6.0** — Legacy Rewrite](./milestones/v6.0-ROADMAP.md) (Completed: 2026-03-15)
