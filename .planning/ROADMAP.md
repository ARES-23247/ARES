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
- [ ] **Phase 32: Final Validation** — ESLint enforcement and legitimate use justifications (6/6 plans ready)
- [ ] **Phase 33: Simulation Playground AI Diff View** — Monaco diff editor for AI code proposals (not yet planned)

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

### Phase 33: Simulation Playground AI Diff View

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 32
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd-plan-phase 33 to break down)

---

### Phase 32: Final Validation

**Goal**: Remove all `@ts-nocheck` directives, enable ESLint `no-explicit-any` enforcement, and document all legitimate `any` uses with justification comments.

**Depends on**: Phase 31 (all violations fixed)

**Requirements**: Validation Checklist, Legitimate Any Cases

**Success Criteria** (what must be TRUE):
1. All `@ts-nocheck` directives removed from 86 files
2. `eslint.config.js` has `"@typescript-eslint/no-explicit-any": "error"`
3. `eslint.config.js` has no API router override block
4. `src/components/generated/**` remains in ignores
5. Zero `any` violations without inline justification comments
6. All justification comments follow format: `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- [Category]: [Reason]`
7. Final violation count documented in phase summary

**Plans**: 6/6 planned

**Wave Structure**:
- Wave 1: 32-01 (ESLint Enforcement) — autonomous, changes rule from "warn" to "error", removes API override
- Wave 2: 32-02 (Justification Audit) — autonomous, depends on 32-01, adds justification comments to remaining uses
- Wave 3: 32-03 (Already-Typed Routes) — autonomous, removes @ts-nocheck from 10 already-typed files
- Wave 4: 32-04 (ts-rest Routes) — autonomous, depends on 32-03, adds HonoContext to 19 ts-rest files
- Wave 5: 32-05 (Non-ts-rest Routes) — autonomous, depends on 32-04, types 22 non-ts-rest files
- Wave 6: 32-06 (Test Files) — autonomous, depends on 32-05, removes @ts-nocheck from 35 test files

Plans:
- [x] 32-01-PLAN.md — Enable ESLint no-explicit-any enforcement, remove API router override, count remaining violations (COMPLETED 2026-05-05)
- [x] 32-02-PLAN.md — Audit remaining violations, add justification comments to legitimate uses, document final count (COMPLETED 2026-05-05)
- [ ] 32-03-PLAN.md — Remove @ts-nocheck from 10 already-typed route files (TODO)
- [ ] 32-04-PLAN.md — Add HonoContext to 19 ts-rest route files, remove @ts-nocheck (TODO)
- [ ] 32-05-PLAN.md — Add proper type annotations to 22 non-ts-rest route files, remove @ts-nocheck (TODO)
- [ ] 32-06-PLAN.md — Remove @ts-nocheck from 35 test files, verify all tests pass (TODO)

---

### Phase 33: Simulation Playground AI Diff View

**Goal**: When z.AI generates or modifies simulation code, show a before/after diff view using Monaco's built-in diff editor instead of blindly replacing the file. This lets students understand what the AI changed before accepting.

**Depends on**: Phase 31-04 (SimulationPlayground Monaco callback types will be cleaned up)

**Background**: The Simulation Playground IDE was enhanced with 8 improvements (keyboard shortcuts, error recovery, localStorage snapshots, CSS support, FPS profiler, shareable links, drag-and-drop import, multi-file module resolution) in commit `05c23339`. The AI Diff View was deferred as the most complex remaining feature.

**Success Criteria** (what must be TRUE):
1. When AI generates code via z.AI chat, changes are stored in a `pendingAiChanges` state instead of immediately applied
2. A diff banner appears below editor tabs showing "AI suggested changes" with Accept / Reject buttons
3. Monaco diff editor (`monaco.editor.createDiffEditor`) shows side-by-side comparison of original vs AI-proposed code
4. Streaming code responses are buffered until complete before showing the diff
5. Accepting changes applies them to the file and triggers recompilation
6. Rejecting changes discards the proposal and restores the original code
7. Inline completions (Ctrl+Space ghost text) are NOT affected — they still apply directly
8. All existing tests still pass

**Architecture Notes**:
- `useSimulationChat.ts` currently calls `setFiles()` directly during streaming. Must change to return a `pendingProposal` object.
- The `SimulationPlayground.tsx` must intercept proposals and render a diff editor when `pendingAiChanges` is set.
- Monaco diff editor lifecycle (create/dispose) must be carefully managed to avoid memory leaks.
- The streaming parser must buffer the complete response before creating the diff — partial diffs are confusing.

**Key Files**:
- `src/hooks/useSimulationChat.ts` — AI response streaming and file mutation logic
- `src/components/SimulationPlayground.tsx` — Editor UI, Monaco editor instance, file state
- `src/components/editor/SimPreviewFrame.tsx` — Preview pane (no changes expected)

**Plans**: 1/1 planned

Plans:
- [x] 33-01-PLAN.md — AI Diff View Implementation (DONE)

 - - - 
 
 # # #   P h a s e   3 5 :   L o c a l   S E O   &   P u b l i c   D i s c o v e r y 
 
 * * G o a l : * *   E s t a b l i s h   a   s t r o n g   s e a r c h   p r e s e n c e   f o r    
 r o b o t i c s  
 i n  
 M o r g a n t o w n   t o   i n c r e a s e   l o c a l   v i s i b i l i t y   a n d   t r a f f i c   f o r   t h e   A R E S W E B   p l a t f o r m . 
 * * D e p e n d s   o n : * *   N o n e 
 * * R e q u i r e m e n t s : * *   T B D 
 * * S u c c e s s   C r i t e r i a : * * 
 1 .   D y n a m i c   S c h e m a . o r g   s t r u c t u r e d   d a t a   o n   a l l   p u b l i c   r o u t e s 
 2 .   M e t a   t a g s   u p d a t e d   f o r   a l l   p u b l i c   r o u t e s 
 3 .   A u t o m a t e d   s i t e m a p . x m l   g e n e r a t e d   f r o m   D 1 
 4 .   A b o u t   p a g e   e n h a n c e d   f o r   g e o g r a p h i c   r e l e v a n c e 
 
 * * P l a n s : * *   0   p l a n s 
 -   [   ]   T B D   ( r u n   / g s d - p l a n - p h a s e   3 5   t o   b r e a k   d o w n ) 
 
 - - - 
 
 # # #   P h a s e   3 6 :   M o b i l e   P W A   E n h a n c e m e n t s 
 
 * * G o a l : * *   B u i l d   r o b u s t   P W A   o f f l i n e   s u p p o r t   a n d   s p e c i a l i z e d   m o b i l e   l a y o u t s   t o   i m p r o v e   m o b i l e   u s a b i l i t y   w i t h o u t   a   f u l l   R e a c t   N a t i v e   r e w r i t e . 
 * * D e p e n d s   o n : * *   P h a s e   3 5 
 * * R e q u i r e m e n t s : * *   T B D 
 * * S u c c e s s   C r i t e r i a : * * 
 1 .   O f f l i n e   s u p p o r t   u s i n g   I n d e x e d D B   f o r   c o r e   r o s t e r / c a l e n d a r / t a s k   f e a t u r e s 
 2 .   S p e c i a l i z e d   m o b i l e   l a y o u t   t h a t   h i d e s   c o m p l e x   I D E / S i m u l a t i o n   t o o l s 
 3 .   P W A   i n s t a l l a b i l i t y   p r o m p t 
 
 * * P l a n s : * *   0   p l a n s 
 -   [   ]   T B D   ( r u n   / g s d - p l a n - p h a s e   3 6   t o   b r e a k   d o w n ) 
 
 - - - 
 
 # # #   P h a s e   3 7 :   H a r d w a r e   &   I n v e n t o r y   T r a c k i n g 
 
 * * G o a l : * *   I m p l e m e n t   a   d e d i c a t e d   I n v e n t o r y   M a n a g e r   t o   t r a c k   m o t o r s ,   s e n s o r s ,   s t r u c t u r a l   p a r t s ,   a n d   s t u d e n t   c h e c k - o u t s . 
 * * D e p e n d s   o n : * *   P h a s e   3 6 
 * * R e q u i r e m e n t s : * *   T B D 
 * * S u c c e s s   C r i t e r i a : * * 
 1 .   I n v e n t o r y   t r a c k i n g   U I   a n d   b a c k e n d   s c h e m a 
 2 .   C h e c k - i n / c h e c k - o u t   l o g s   l i n k e d   t o   s t u d e n t   a c c o u n t s 
 3 .   L o w - s t o c k   a l e r t s   i n t e g r a t e d   w i t h   Z u l i p 
 4 .   I n t e g r a t i o n   w i t h   S t o r e f r o n t / F i n a n c e   l e d g e r 
 
 * * P l a n s : * *   0   p l a n s 
 -   [   ]   T B D   ( r u n   / g s d - p l a n - p h a s e   3 7   t o   b r e a k   d o w n ) 
  
 