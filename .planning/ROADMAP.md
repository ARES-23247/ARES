# Milestone Roadmap

## Milestones

- ✅ **v6.6 TypeScript Strictness** — Phases 21-26 (shipped 2026-05-05)
- 🚧 **v6.7 TypeScript Any Elimination** — Phases 27-32 (active)
- ✅ **v6.5 Zulip Sync & Social Media** — (shipped 2026-05-04)
- ✅ **v6.4 Science & Math Corner** — (shipped 2026-04-20)
- ✅ **v6.2 Frontend Upgrades** — (shipped 2026-04-05)
- ✅ **v6.0 Legacy Rewrite** — (shipped 2026-03-15)

## Phases

<details>
<summary>✅ v6.6 TypeScript Strictness (Phases 21-26) — SHIPPED 2026-05-05</summary>

- [x] Phase 21: Core Domain & Data Layer Strictness (1/1 plans) — completed 2026-05-05
- [x] Phase 22: ARES Physics & Math Engine Validation (1/1 plans) — completed 2026-05-05
- [x] Phase 23: R3F & Sim Component Typings (1/1 plans) — completed 2026-05-05
- [x] Phase 24: ESLint Lockdown & CI Validation — ⏸ Deferred (983 `any` violations, multi-session)
- [x] Phase 25: Comprehensive Security Audit (1/1 plans) — completed 2026-05-04
- [x] Phase 26: Calendar & Event Editor Enhancements (1/1 plans) — completed 2026-05-05

</details>

### 🚧 v6.7 TypeScript Any Elimination (Phases 27-32)

**Goal**: Eliminate 983 `@typescript-eslint/no-explicit-any` violations through shared type infrastructure and systematic fixes.

- [x] **Phase 27: Type Foundation** — Create `shared/types/` with core generics and handler types (completed 2026-05-05)
- [x] **Phase 28: High-Impact Handlers** — Fix top 4 violation files (~192 any, ~60% of total) (completed 2026-05-05)
- [x] **Phase 28.1: AI Simulation & Analytics Stabilization** — Fix module resolution and dashboard regressions (completed 2026-05-05)
- [x] **Phase 29: Contract Inference** — Full ts-rest contract inference with Zod boundaries (completed 2026-05-05)
- [x] **Phase 29.1: Remaining Route Contract Inference** — Migrate remaining 11 route files to contract inference (4/4 plans ready, 4/4 complete)
- [ ] **Phase 30: Test Types** — Mock factories and typed test helpers (8/8 plans ready)
- [ ] **Phase 31: Frontend Components** — React prop interfaces and event handler types (5/5 plans ready)
- [ ] **Phase 32: Final Validation** — ESLint enforcement and legitimate use justifications (2/2 plans ready)

## Phase Details

### Phase 27: Type Foundation

**Goal**: Establish shared type infrastructure that prevents circular dependencies and provides reusable patterns for all `any` elimination work.

**Depends on**: Nothing (foundation phase)

**Requirements**: Anti-pattern 1 (Over-Genericizing Types), Anti-pattern 5 (Circular Dependencies), Foundation checklist items

**Success Criteria** (what must be TRUE):
1. `shared/types/` directory exists with organized exports (api, database, contracts, utility)
2. `D1Row<T>` generic unwraps Kysely's `Generated<>` wrapper correctly
3. `HonoContext` branded type exports `AppEnv` without circular dependencies
4. Handler input/output types are defined and imported by at least 2 route files
5. ESLint rule `no-explicit-any` remains disabled for `functions/api/routes/**/*` (temporary)

**Plans**: 2/2 planned

**Wave Structure**:
- Wave 1: 27-01 (Type Foundation) — autonomous, creates shared/types/
- Wave 2: 27-02 (Route Adoption) — autonomous, depends on 27-01

Plans:
- [x] 27-01-PLAN.md — Create shared/types/ directory with D1Row<T>, HonoContext, handler types, contracts, utility, and barrel export (COMPLETED 2026-05-05)
- [x] 27-02-PLAN.md — Import HandlerInput/HandlerOutput into docs.ts and sponsors.ts to demonstrate type adoption pattern (COMPLETED 2026-05-05)

---

### Phase 28: High-Impact Handlers

**Goal**: Fix the 4 files with the most violations, delivering ~60% reduction in `any` usage while validating the type foundation.

**Depends on**: Phase 27 (requires `D1Row<T>`, `HonoContext`, handler types)

**Requirements**: Anti-pattern 2 (Blind `any` -> `unknown` Replacement), Big Files checklist items

**Success Criteria** (what must be TRUE):
1. `functions/api/routes/events/handlers.ts` reduced from 77 to 0 violations
2. `functions/api/routes/docs.ts` reduced from 51 to 0 violations
3. `functions/api/routes/comments.ts` reduced from 33 to 0 violations
4. `functions/api/routes/sponsors.ts` reduced from 31 to 0 violations
5. All 4 files compile with strict TypeScript and tests pass unchanged

**Plans**: 1/1 planned

**Wave Structure**:
- Wave 1: 28-01 (High-Impact Handlers) — autonomous, depends on 27-01, 27-02

Plans:
- [x] 28-01-PLAN.md — Eliminate all `any` violations in events/handlers.ts, docs.ts, comments.ts, and sponsors.ts using HandlerInput, HonoContext, and D1Row types from Phase 27 (COMPLETED 2026-05-05)

---

### Phase 28.1: AI Simulation & Analytics Stabilization

**Goal**: Restore and stabilize the AI educational simulations and fix regressions in the analytics dashboard caused by recent metrics integration.

**Depends on**: Discovered urgent work during v6.7 execution

**Success Criteria** (what must be TRUE):
1. `SimRunner.tsx` correctly resolves kebab-case simulation folders (e.g., `nn-activation`)
2. `nn-biology` simulation compiles without missing icon errors
3. `AnalyticsDashboard.tsx` and `useAcademy.ts` compile without TypeScript errors
4. Analytics backend route handles empty telemetry tables gracefully (no 500 errors)
5. `npm run generate:sims` updates registry with 29 active simulations

**Plans**: 1/1 planned

**Wave Structure**:
- Wave 1: 28.1-01 (Stabilization) — autonomous, emergency fix

Plans:
- [x] PLAN.md — Stabilize AI simulations, fix analytics regressions, and implement backend resilience (COMPLETED 2026-05-05)

---

### Phase 29: Contract Inference

**Goal**: Lock in type safety at API boundaries using ts-rest contract inference and Zod runtime validation.

**Depends on**: Phase 28 (validated patterns from high-impact fixes)

**Requirements**: Anti-pattern 4 (Runtime Type Assumptions), Contract inference goal

**Success Criteria** (what must be TRUE):
1. All ts-rest contracts use full type inference from `initServer<AppEnv>`
2. Zod validators validate external data at API boundaries (POST/PUT inputs)
3. Contract types are exported for frontend consumption
4. No `as` casts from untrusted external sources remain
5. Runtime validation errors return proper 400 responses

**Plans**: 2/2 planned

**Wave Structure**:
- Wave 1: 29-01 (Type Exports & Reference) — autonomous, depends on 28-01
- Wave 2: 29-02 (Batch Migration & Exports) — autonomous, depends on 29-01

Plans:
- [x] 29-01-PLAN.md — Export ts-rest-hono contract inference types (AppRouteInput, AppRouteImplementation) and migrate analytics.ts as reference implementation (COMPLETED 2026-05-05)
- [x] 29-02-PLAN.md — Migrate remaining 14 route files to contract inference, export all 29 contract types for frontend, deprecate HandlerInput, and document patterns (COMPLETED 2026-05-05)

---

### Phase 29.1: Remaining Route Contract Inference

**Goal**: Migrate the remaining 11 route files to ts-rest contract inference, eliminating `as any` casts from router setup and enabling runtime response validation.

**Depends on**: Phase 29 (provides the migration pattern)

**Requirements**: Anti-pattern 4 (Runtime Type Assumptions), Contract inference goal

**Success Criteria** (what must be TRUE):
1. All remaining route files use full type inference from `initServer<AppEnv>`
2. Zero `as any` casts in router setup across all route files
3. Runtime response validation enabled on all routes
4. Handler signatures use inferred `(input, c)` pattern without explicit types
5. All contracts already export their types (from Phase 29-02)

**Plans**: 4/4 planned

**Wave Structure**:
- Wave 1: 29.1-01, 29.1-02, 29.1-03 (Inline handlers) — parallel execution, 2-3 files each
- Wave 2: 29.1-04 (Handler modules) — depends on Wave 1 completion

Plans:
- [x] 29.1-01-PLAN.md — Migrate awards.ts, entities.ts, locations.ts, tasks.ts, tba.ts to contract inference (COMPLETED 2026-05-05)
- [x] 29.1-02-PLAN.md — Migrate judges.ts and users.ts to contract inference (COMPLETED 2026-05-05)
- [x] 29.1-03-PLAN.md — Migrate posts.ts and zulip.ts to contract inference (COMPLETED 2026-05-05)
- [x] 29.1-04-PLAN.md — Migrate handler modules (inquiries/, outreach/, media/) to contract inference (COMPLETED 2026-05-05)

---

### Phase 30: Test Types

**Goal**: Systematically eliminate 131 `any` violations in 82 test files using mock factories and typed test helpers.

**Depends on**: Phase 29 (provides `D1Row<T>` and other shared types)

**Requirements**: Anti-pattern 3 (Over-Typed Test Mocks), TEST-01 through TEST-04

**Success Criteria** (what must be TRUE):
1. `src/test/types.ts` exists with MockKysely, TestEnv, MockExecutionContext, MockExpressionBuilder types
2. All 6 factory files return D1Row<T> or domain types instead of Record<string, unknown>
3. All 26 backend test files use MockKysely for mockDb and Hono<TestEnv> for app typing
4. `src/test/utils.tsx` has zero `any` violations
5. E2E tests have zero `any` violations
6. All tests still pass after migration

**Plans**: 8/8 planned

**Wave Structure**:
- Wave 1: 30-01 (Type Infrastructure) — autonomous, creates src/test/types.ts
- Wave 2: 30-02 (Factory Migration) — autonomous, depends on 30-01, updates 6 factory files
- Wave 3: 30-03 through 30-07 (Backend Test Migration) — autonomous, depends on 30-01, 30-02, parallel execution
- Wave 4: 30-08 (E2E Test Fix) — autonomous, depends on 30-01, fixes 2 E2E violations

Plans:
- [x] 30-01-PLAN.md — Create src/test/types.ts with MockKysely, TestEnv, MockExecutionContext, MockExpressionBuilder and update utils.tsx (COMPLETE)
- [x] 30-02-PLAN.md — Migrate all 6 factory files to D1Row<T> return types (COMPLETE)
- [ ] 30-03-PLAN.md — Migrate auth/core tests (auth.test.ts, users.test.ts, profiles.test.ts, badges.test.ts, _profileUtils.test.ts) to typed mocks (TODO)
- [x] 30-04-PLAN.md — Migrate content/docs tests (docs.test.ts, posts.test.ts, comments.test.ts, media.test.ts) to typed mocks (COMPLETED 2026-05-05)
- [ ] 30-05-PLAN.md — Migrate events/logistics tests (events.test.ts, seasons.test.ts, outreach.test.ts, logistics.test.ts, locations.test.ts) to typed mocks (TODO)
- [ ] 30-06-PLAN.md — Migrate admin/operations tests (sponsors.test.ts, finance.test.ts, store.test.ts, tasks.test.ts, settings.test.ts, notifications.test.ts) to typed mocks (TODO)
- [ ] 30-07-PLAN.md — Migrate integration/misc tests (github.test.ts, githubWebhook.test.ts, zulip.test.ts, zulipWebhook.test.ts, tba.test.ts, points.test.ts, awards.test.ts, judges.test.ts, inquiries.test.ts, communications.test.ts, entities.test.ts, analytics.test.ts) to typed mocks (TODO)
- [ ] 30-08-PLAN.md — Fix E2E test `any` violations (media.spec.ts, kanban.spec.ts) (TODO)

---

### Phase 31: Frontend Components

**Goal**: Eliminate `any` violations in React components and hooks through proper prop interfaces and event handler types.

**Depends on**: Phase 30 (test infrastructure won't interfere)

**Requirements**: Anti-pattern 1 (Over-Genericizing Types), Frontend Checklist

**Success Criteria** (what must be TRUE):
1. `src/types/components.ts` exists with IconComponent type and getLucideIcon utility
2. Zero `any` violations in BadgeManager.tsx (icon lookup)
3. Zero `any` violations in GenericKanbanBoard.tsx (icon prop)
4. Zero `any` violations in ErrorBoundary.tsx (error type)
5. Zero `any` violations in FinanceManager.tsx (mutation types)
6. Zero `any` violations in Blog.tsx (response types)
7. Zero `any` violations in SimulationPlayground.tsx (Monaco callbacks)
8. Zero `any` violations in CollaborativeEditorRoom.tsx (window globals)
9. All existing tests still pass

**Plans**: 5/5 planned

**Wave Structure**:
- Wave 1: 31-01 (Icon Types), 31-02 (ErrorBoundary) — parallel execution
- Wave 2: 31-03 (Contract Types), 31-04 (Monaco Types) — depends on Phase 29
- Wave 3: 31-05 (Window Globals) — autonomous

Plans:
- [ ] 31-01-PLAN.md — Create src/types/components.ts with IconComponent type and getLucideIcon utility, fix BadgeManager and GenericKanbanBoard icon types (TODO)
- [ ] 31-02-PLAN.md — Fix ErrorBoundary to use `unknown` with type narrowing instead of `any` (TODO)
- [ ] 31-03-PLAN.md — Fix FinanceManager and Blog.tsx to use proper contract types from Phase 29 (TODO)
- [ ] 31-04-PLAN.md — Fix SimulationPlayground Monaco Editor callbacks to use monaco-editor package types (TODO)
- [ ] 31-05-PLAN.md — Create Window interface augmentation for Playwright test globals, fix CollaborativeEditorRoom (TODO)

---

### Phase 32: Final Validation

**Goal**: Enable ESLint `no-explicit-any` enforcement and document all legitimate `any` uses with justification comments.

**Depends on**: Phase 31 (all violations fixed)

**Requirements**: Validation Checklist, Legitimate Any Cases

**Success Criteria** (what must be TRUE):
1. `eslint.config.js` has `"@typescript-eslint/no-explicit-any": "error"`
2. `eslint.config.js` has no API router override block
3. `src/components/generated/**` remains in ignores
4. Zero `any` violations without inline justification comments
5. All justification comments follow format: `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- [Category]: [Reason]`
6. Final violation count documented in phase summary

**Plans**: 2/2 planned

**Wave Structure**:
- Wave 1: 32-01 (ESLint Enforcement) — autonomous, changes rule from "warn" to "error", removes API override
- Wave 2: 32-02 (Justification Audit) — autonomous, depends on 32-01, adds justification comments to remaining uses

Plans:
- [ ] 32-01-PLAN.md — Enable ESLint no-explicit-any enforcement, remove API router override, count remaining violations (TODO)
- [ ] 32-02-PLAN.md — Audit remaining violations, add justification comments to legitimate uses, document final count (TODO)
