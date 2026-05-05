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

- [ ] **Phase 27: Type Foundation** — Create `shared/types/` with core generics and handler types
- [ ] **Phase 28: High-Impact Handlers** — Fix top 4 violation files (~192 any, ~60% of total)
- [ ] **Phase 29: Contract Inference** — Full ts-rest contract inference with Zod boundaries
- [ ] **Phase 30: Test Types** — Mock factories and typed test helpers
- [ ] **Phase 31: Frontend Components** — React prop interfaces and event handler types
- [ ] **Phase 32: Final Validation** — ESLint enforcement and legitimate use justifications

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

**Plans**: 1/1 planned

Plans:
- [ ] 27-01-PLAN.md — Create shared/types/ directory with D1Row<T>, HonoContext, handler types, and barrel export

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

**Plans**: TBD

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

**Plans**: TBD

---

### Phase 30: Test Types

**Goal**: Standardize test mocking with type-safe factories while maintaining test flexibility.

**Depends on**: Phase 27 (shared types for factory building)

**Requirements**: Anti-pattern 3 (Over-Typed Test Mocks), Test Files checklist items

**Success Criteria** (what must be TRUE):
1. Mock factory functions exist for common entities (Task, Post, Sponsor, Event)
2. All test mocks use `Partial<T>` pattern (no inline objects >10 properties)
3. `as unknown as T` casts are limited and documented with justification
4. Test utilities are typed and exported from `test/setup.ts`
5. All tests pass with no new `any` violations introduced

**Plans**: TBD

---

### Phase 31: Frontend Components

**Goal**: Explicit React prop interfaces and proper event handler types for remaining `any` violations in UI code.

**Depends on**: Phase 29 (contract types available for consumption)

**Requirements**: Anti-pattern 1 (Over-Genericizing Types), Frontend checklist items

**Success Criteria** (what must be TRUE):
1. All React component props have explicit interfaces (not inferred)
2. Event handlers use proper generics (`ChangeEvent<T>`, `FormEvent<T>`)
3. External library `any` uses are preserved with eslint-disable comments
4. PartyKit and Tiptap types remain loose (awaiting upstream stability)
5. No circular imports between component type files

**Plans**: TBD
**UI hint**: yes

---

### Phase 32: Final Validation

**Goal**: Audit all remaining `any` uses for legitimacy, enable ESLint enforcement, and document justified exceptions.

**Depends on**: Phase 28, 29, 30, 31 (all elimination work complete)

**Requirements**: All anti-patterns, Validation checklist items, Legitimate `any` cases

**Success Criteria** (what must be TRUE):
1. Total `@typescript-eslint/no-explicit-any` violations < 20 (only legitimate uses)
2. Each remaining `any` has `eslint-disable-next-line` comment with justification
3. ESLint `no-explicit-any` rule is enabled across the entire codebase
4. CI pipeline enforces zero new `any` violations
5. No circular type dependencies detected in compilation
6. All 7 validation checklist items are satisfied

**Plans**: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 27. Type Foundation | 1/1 planned | Planning | - |
| 28. High-Impact Handlers | 0/4 | Planning | - |
| 29. Contract Inference | 0/4 | Planning | - |
| 30. Test Types | 0/4 | Planning | - |
| 31. Frontend Components | 0/4 | Planning | - |
| 32. Final Validation | 0/4 | Planning | - |

---

### Archived Milestones

- [**v6.6** — TypeScript Strictness](./milestones/v6.6-ROADMAP.md) (Completed: 2026-05-05)
- [**v6.5** — Zulip Sync & Social Media Formalization](./milestones/v6.5-ROADMAP.md) (Completed: 2026-05-04)
- [**v6.4** — Web App Architecture](./milestones/v6.4-ROADMAP.md) (Completed: 2026-04-20)
- [**v6.2** — Frontend Upgrades](./milestones/v6.2-ROADMAP.md) (Completed: 2026-04-05)
- [**v6.0** — Legacy Rewrite](./milestones/v6.0-ROADMAP.md) (Completed: 2026-03-15)
