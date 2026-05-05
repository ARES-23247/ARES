# Milestone Roadmap

## Current Overview

- 🎯 **Goal:** TBD
- 🛑 **Blockers:** None
- 🚧 **v6.6** — Next Iteration (Active)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 21 | v6.6 | 1/1 | ✅ Done | 2026-05-05 |
| 22 | v6.6 | 1/1 | Complete    | 2026-05-05 |
| 23 | v6.6 | 0/1 | Pending | - |
| 24 | v6.6 | 0/1 | Pending | - |
| 25 | v6.6 | 1/1 | ✅ Done | 2026-05-05 |

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

### Phase 25: Calendar & Event Editor Enhancements
**Goal:** Add a quick-add modal to the calendar, replace native location selects with a searchable combobox, fix collaborative editing connectivity, and update E2E tests.
**Status:** ✅ Done
**Commits:** `45df07f`, `d59542d`, `cca8dc5`, `88e13ae`
**Summary:**
- Created `QuickAddEventModal` component with pre-filled date/times, category selector with ARES colors, and keyboard accessibility.
- Built `LocationCombobox` component (`@headlessui/react`) replacing native `<select>` in both `EventEditor` and `QuickAddEventModal` with searchable/autocomplete venue selection.
- Integrated `CreateLocationModal` into both event forms for inline "Add New Venue" workflow.
- Fixed collaborative editing WebSocket connection failure caused by incorrect `/party` path suffix appended to the PartyKit host (y-partykit already appends `/parties/main/`).
- Updated E2E test (`EventEditor.spec.ts`) to use combobox interactions (`fill` + `getByRole("option")`) instead of `selectOption`.

---

### Archived Milestones

- [**v6.5** — Zulip Sync & Social Media Formalization](./milestones/v6.5-ROADMAP.md) (Completed: 2026-05-04)
- [**v6.4** — Web App Architecture](./milestones/v6.4-ROADMAP.md) (Completed: 2026-04-20)
- [**v6.2** — Frontend Upgrades](./milestones/v6.2-ROADMAP.md) (Completed: 2026-04-05)
- [**v6.0** — Legacy Rewrite](./milestones/v6.0-ROADMAP.md) (Completed: 2026-03-15)
