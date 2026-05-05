---
gsd_state_version: 1.0
milestone: v6.7
milestone_name: TypeScript Any Elimination
status: Ready for 30-05 (Events/Logistics Test Migration)
last_updated: "2026-05-05T19:53:00.000Z"
last_activity: 2026-05-05
progress:
  total_phases: 10
  completed_phases: 4
  total_plans: 34
  completed_plans: 14
  percent: 41
---

# System State

**Current Milestone**: v6.7 — TypeScript Any Elimination
**Status**: Phase 30 in progress — 4/8 plans executed
**Last activity**: 2026-05-05

## Current Position

Phase: 30 (Test Types) — IN PROGRESS
Plan: 30-04 executed (Content/Docs Test Migration complete)
Status: Ready for 30-05 (Events/Logistics Test Migration)
Last activity: 2026-05-05

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-05)

**Core value:** Championship-grade FIRST Robotics team management platform
**Current focus:** Phase 29.1 — Remaining Route Contract Inference

## Milestone v6.7: TypeScript Any Elimination

**Goal**: Systematically eliminate all `@typescript-eslint/no-explicit-any` violations across the codebase through shared type creation and parallel agent execution.

**Approach**: Foundation-first with 7 phases — create shared types, fix high-impact handlers, establish contract inference, migrate remaining routes, standardize test mocks, address frontend components, and validate remaining uses.

**Violation target**: 983 → <20 (only legitimate uses with justification comments)

## Phase 27 Complete: Type Foundation

### Delivered

- `shared/types/` directory with 5 type files
- `D1Row<T>` generic for database row types
- `HonoContext`, `HandlerInput`, `HandlerOutput` for API handlers
- `ContractHandler<T>` for ts-rest integration (Phase 29 prep)
- Barrel export for clean imports

### Route Adoption Demo

- docs.ts: 15 handler signatures migrated
- sponsors.ts: 7 handler signatures migrated
- Pattern established for Phase 28 mass migration

---

## Phase 28 Complete: High-Impact Handlers

### Delivered

- `functions/api/routes/events/handlers.ts`: 77 violations fixed
- `functions/api/routes/docs.ts`: 51 violations fixed
- `functions/api/routes/comments.ts`: 33 violations fixed
- `functions/api/routes/sponsors.ts`: 31 violations fixed
- Validated shared type adoption across core business logic

---

## Phase 28.1 Complete: AI Simulation & Analytics Stabilization

### Delivered

- `SimRunner.tsx`: Fixed dynamic import path resolution (folder vs id)
- `nn-biology`: Fixed missing Lucide icon import
- `AnalyticsDashboard.tsx`: Added explicit types to resolve `implicit any`
- `useAcademy.ts`: Corrected analytics category to `'doc'`
- `functions/api/routes/analytics.ts`: Implemented database query resilience

---

## Phase 29 Complete: Contract Inference

### Delivered

- `shared/types/contracts.ts`: Exported `AppRouteImplementation`, `AppRouteInput`, `ServerInferResponses`, `RecursiveRouterObj` from ts-rest-hono
- `shared/schemas/contracts/index.ts`: Re-exports all 29 contract types for frontend consumption
- 15 route files migrated to contract inference (analytics.ts reference + 14 production routes)
- Response validation enabled across all 15 routes with proper error handlers
- `HandlerInput` type marked as `@deprecated` in `shared/types/api.ts`

### Commits

- (Plan 29-01) Type infrastructure and analytics.ts reference
- (Plan 29-02) Batch migration of 14 routes and contract exports

## Phase 29.1: Remaining Route Contract Inference — PLANNED

### Status

Research complete, 4 plans created.

### Goal

Migrate the remaining 11 route files to ts-rest contract inference, eliminating `as any` casts from router setup and enabling runtime response validation.

### Files to Migrate

**Inline handlers (9):**

- awards.ts, entities.ts, judges.ts, locations.ts, posts.ts, tasks.ts, tba.ts, users.ts, zulip.ts

**Handler modules (3 directories):**

- inquiries/ (handlers.ts, index.ts)
- outreach/ (handlers.ts, index.ts)
- media/ (handlers.ts, index.ts)

### Success Criteria

1. All 11 route files use full type inference from `initServer<AppEnv>`
2. Zero `as any` casts in router setup
3. Runtime response validation enabled on all routes
4. Handler signatures use inferred `(input, c)` pattern
5. All contracts already export types (from Phase 29-02)

### Wave Structure

- **Wave 1**: 29.1-01 (awards, entities, locations, tasks, tba), 29.1-02 (judges, users), 29.1-03 (posts, zulip) — parallel execution
- **Wave 2**: 29.1-04 (inquiries, outreach, media handler modules) — depends on Wave 1

### Plans

- [x] 29.1-01-PLAN.md — Migrate awards.ts, entities.ts, locations.ts, tasks.ts, tba.ts to contract inference
- [x] 29.1-02-PLAN.md — Migrate judges.ts and users.ts to contract inference
- [x] 29.1-03-PLAN.md — Migrate posts.ts and zulip.ts to contract inference
- [ ] 29.1-04-PLAN.md — Migrate handler modules (inquiries/, outreach/, media/) to contract inference

---

## Phase 30: Test Types — IN PROGRESS

### Status

Research complete, 8 plans created. 1/8 plans executed.

### Completed Plans

- [x] 30-01-PLAN.md — Type Infrastructure (src/test/types.ts) — Complete
  - Created src/test/types.ts with MockKysely, TestEnv, MockExecutionContext, MockExpressionBuilder
  - Eliminated all 3 `any` violations from src/test/utils.tsx
  - Requirements completed: TEST-01, TEST-02, TEST-03, TEST-04
- [x] 30-02-PLAN.md — Factory Migration — Complete
  - Migrated 6 factory files to use D1Row<T> types
- [x] 30-03-PLAN.md — Auth/Core Backend Test Migration — Complete
  - Migrated auth.test.ts, users.test.ts, profiles.test.ts, badges.test.ts, _profileUtils.test.ts to MockKysely and TestEnv
  - 71/71 tests pass, zero `: any` violations remaining
- [x] 30-04-PLAN.md — Content Backend Test Migration — Complete
  - Migrated blog, docs, posts, media tests to MockKysely and TestEnv
- [x] 30-05-PLAN.md — Events/Logistics Test Types Migration — Complete
  - Migrated events, seasons, outreach, logistics, locations tests to MockKysely and TestEnv

### Remaining Plans

- 30-06: Admin/Operations Backend Test Migration (awards, judges, tasks, etc.)
- 30-07: Remaining Backend Test Migration (inquiries, entities, tba, zulip)
- 30-08: E2E Test Fix

## Phase 31: Frontend Components — PLANNED

### Status

Research complete, 5 plans created.

### Goal

Eliminate all `any` violations in React components and hooks through proper prop interfaces and event handler types.

### Success Criteria

1. `src/types/components.ts` exists with IconComponent type and getLucideIcon utility
2. Zero `any` violations in BadgeManager.tsx (icon lookup)
3. Zero `any` violations in GenericKanbanBoard.tsx (icon prop)
4. Zero `any` violations in ErrorBoundary.tsx (error type)
5. Zero `any` violations in FinanceManager.tsx (mutation types)
6. Zero `any` violations in Blog.tsx (response types)
7. Zero `any` violations in SimulationPlayground.tsx (Monaco callbacks)
8. Zero `any` violations in CollaborativeEditorRoom.tsx (window globals)
9. All existing tests still pass

### Wave Structure

- **Wave 1**: 31-01 (Icon Types), 31-02 (ErrorBoundary) — parallel execution
- **Wave 2**: 31-03 (Contract Types), 31-04 (Monaco Types) — depends on Phase 29
- **Wave 3**: 31-05 (Window Globals) — autonomous

### Plans

- [ ] 31-01-PLAN.md — Create src/types/components.ts with IconComponent type and getLucideIcon utility, fix BadgeManager and GenericKanbanBoard icon types
- [ ] 31-02-PLAN.md — Fix ErrorBoundary to use `unknown` with type narrowing instead of `any`
- [ ] 31-03-PLAN.md — Fix FinanceManager and Blog.tsx to use proper contract types from Phase 29
- [ ] 31-04-PLAN.md — Fix SimulationPlayground Monaco Editor callbacks to use monaco-editor package types
- [ ] 31-05-PLAN.md — Create Window interface augmentation for Playwright test globals, fix CollaborativeEditorRoom

## Deferred Items

| Category | Item | Source | Status |
|----------|------|--------|--------|
| requirement | MON-03 (usage metrics dashboard) | v5.7 | In progress |
| investigation | 3D Hardware Visualizer headless WebGL optimization | v4.1 | Pending |

## Accumulated Context

### Key Decisions (v6.7)

1. **Type-first approach**: Create `shared/types/` before fixing violations to prevent rework
2. **High-impact first**: Target 4 files with ~60% of violations (events/handlers.ts, docs.ts, comments.ts, sponsors.ts)
3. **Legitimate `any` preservation**: External library gaps, system boundaries, and test mocks documented with eslint-disable
4. **No blind replacement**: Each `any` requires context-specific handling, not wholesale `any` → `unknown`

### Anti-Patterns to Avoid

1. Over-Genericizing Types (≤2 generic params, ≤5 lines type definition)
2. Blind `any` → `unknown` replacement (context-specific handling only)
3. Over-Typed Test Mocks (use `Partial<T>`, factories, ≤10 properties)
4. Runtime Type Assumptions (use Zod for boundaries)
5. Circular Type Dependencies (string identifiers, domain layering)

### Research Insights

- Kysely `Selectable<>`, `Insertable<>` types already available
- Hono `AppEnv` binding exists but not consistently used
- ts-rest-hono provides full contract inference when properly configured
- No new dependencies required — TypeScript 5.8+ has all needed utilities

## Session Continuity

**Last session**: Production hotfix — PartyKit CSP, Roster API triple schema mismatch, Pa11y contrast (2026-05-05)
**This session**: See `.planning/logs/2026-05-05-hotfix-partykit-roster-a11y.md`
**Next step**: Resume Phase 30 with `/gsd-execute-phase 30` (Test Types — 30-06 next)
