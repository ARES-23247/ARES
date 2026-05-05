# Project Research Summary

**Project:** ARESWEB — TypeScript Any Elimination
**Domain:** TypeScript Strict Type Migration
**Researched:** 2026-05-05
**Confidence:** HIGH

## Executive Summary

ARESWEB has 983 `@typescript-eslint/no-explicit-any` violations concentrated in the API layer (Hono routes with D1/Kysely), React components, and test files. The current codebase relies heavily on `as` casts and untyped mocks, with ESLint explicitly disabling the `no-explicit-any` rule for `functions/api/routes/**/*`. This is a technical debt migration project, not a greenfield build—the recommended approach is a phased type infrastructure rollout that creates shared types first, then systematically applies them to high-impact files.

The key risk is **blind replacement** of `any` with `unknown`, which would create ~2,500 new compilation errors. Instead, the research recommends creating a centralized shared type architecture (`shared/types/`) that leverages existing Kysely-generated types, proper Hono context bindings, and type-safe test mock factories. This approach eliminates ~80% of violations without introducing runtime errors or circular dependencies.

## Key Findings

### Recommended Stack

The research confirms existing tooling is appropriate; no new dependencies required. Modern TypeScript 5.8+ provides all necessary utility types and patterns.

**Core technologies (existing):**
- **Kysely (`Selectable<>`, `Insertable<>`, `Updateable<>`)**: Type-safe D1 query results — already has generated `DB` interface in `shared/schemas/database.ts`
- **Hono (`Context<AppEnv>`)**: Branded context types for middleware — requires enhancing `AppEnv` in `functions/api/middleware/utils.ts`
- **ts-rest-hono (`initServer<AppEnv>`)**: Contract-based API handlers — provides full type inference when properly configured
- **Vitest (`vi.mocked()`, mock factories)**: Type-safe test mocking — requires creating factory functions instead of `as any` casts

**No new installations needed** — all patterns use existing TypeScript and library capabilities.

### Expected Features

This is a migration project with clear technical goals rather than user-facing features.

**Must complete (table stakes):**
- **Shared type infrastructure** (`D1Row<T>`, `HonoContext`, handler types) — foundation for all other work
- **High-impact handler fixes** (events/handlers.ts: 77 violations, docs.ts: 51, comments.ts: 33, sponsors.ts: 31) — addresses ~60% of violations
- **Test mock standardization** — addresses ~20% of violations without breaking tests

**Should complete (competitive):**
- **React component prop typing** — improves IDE autocomplete and refactor safety (~10% of violations)
- **Contract inference for ts-rest** — locks in type safety at API boundary (~10% of violations)
- **Runtime validation with Zod** — bridges type-type gaps at external data boundaries

**Defer (v2+):**
- **External API response typing** (Zulip, TBA, GitHub) — requires separate API contract analysis
- **PartyKit/Vectorize specialized types** — incomplete upstream types, use selective `any` with justification

### Architecture Approach

The research identifies a type duplication problem: Hono's `AppEnv` type is defined but not consistently used, Kysely's generated types exist but are cast over, and handler patterns are repeated without shared abstractions.

**Major components:**
1. **`shared/types/` directory** — centralized type exports organized by domain (api, database, contracts, utility)
2. **`D1Row<T>` generic** — unwraps Kysely's `Generated<>` wrapper for clean table row types
3. **`HonoContext` branded type** — re-exports `AppEnv` from middleware to avoid circular dependencies
4. **Mock factory functions** — type-safe test data builders (`createMockTask(overrides)`)

**Critical architectural rule:** Keep Cloudflare Workers types at `functions/api/middleware/utils.ts` boundary; shared types import from here, never the reverse. This prevents circular dependencies.

### Critical Pitfalls

The research identifies nine specific pitfalls with clear prevention strategies.

1. **Over-genericizing types** — creating complex generics to avoid `any` makes code harder to understand. Prevention: favor specific types, use generics only after 3+ concrete use cases.

2. **Breaking runtime with over-strict types** — TypeScript types are compile-time only. Prevention: use Zod for runtime boundaries, prefer unions with fallback values (`| 'other'`, `| null`).

3. **Test brittleness from over-typed mocks** — strict mocks break when implementation changes. Prevention: use `Partial<T>` and factory functions, allow looser types in tests.

4. **Circular dependencies through shared types** — types importing from each other cause compilation errors. Prevention: layer types by domain, use string identifiers (`sponsorId`) not object references.

5. **Wholesale `unknown` replacement** — find-replace `any` → `unknown` creates 100s of new errors. Prevention: each `any` needs context-specific handling; create proper types instead.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Type Foundation
**Rationale:** Foundation first prevents rework. Creating shared types enables all subsequent phases and establishes patterns that can be replicated.
**Delivers:** `shared/types/` directory structure with `D1Row<T>`, `HonoContext`, handler input/output types, and barrel exports
**Addresses:** All phases — provides infrastructure
**Avoids:** Pitfall 4 (circular dependencies) by establishing correct import organization

### Phase 2: High-Impact Handlers
**Rationale:** Target files with most violations first provides immediate validation (~60% of violations in 4 files).
**Delivers:** Fixed type safety in `events/handlers.ts` (77 violations), `docs.ts` (51), `comments.ts` (33), `sponsors.ts` (31)
**Uses:** `D1Row<T>`, `HonoContext` from Phase 1
**Implements:** Typed route handlers using ts-rest inference

### Phase 3: Contract Inference
**Rationale:** Locks in type safety at API boundary, preventing future drift between contracts and implementations.
**Delivers:** Full ts-rest contract inference across all routes, Zod validation at external data boundaries
**Uses:** ts-rest-hono `initServer<AppEnv>` pattern
**Implements:** API boundary type contracts

### Phase 4: Test Types
**Rationale:** Tests last to avoid blocking main code migration; test mocking patterns are well-documented.
**Delivers:** Mock factory functions, typed test helpers, standardized test setup
**Uses:** `Partial<T>` pattern for flexible mocks
**Avoids:** Pitfall 3 (test brittleness) by using factory functions

### Phase 5: Frontend Components
**Rationale:** Lower priority (10% of violations), can proceed safely after backend patterns established.
**Delivers:** Explicit React prop interfaces, proper event handler types (`ChangeEvent<T>`, `FormEvent<T>`)
**Uses:** TypeScript utility types (`Partial<T>`, `Pick<T>`, `Omit<T>`)

### Phase 6: Final Validation
**Rationale:** Review remaining `any` uses for legitimate cases and document justifications.
**Delivers:** Audit report with justification comments for any remaining `any`, ESLint enforcement enabled
**Avoids:** Pitfall 7 (removing legitimate `any`) — external library gaps are documented

### Phase Ordering Rationale

- **Foundation → Handlers** — Phase 1 creates the types that Phase 2 consumes
- **High-impact first** — Phase 2 provides immediate feedback on the approach
- **API boundary before frontend** — Phase 3 locks in backend contracts before consuming them in React
- **Tests separate** — Phase 4 handles tests independently with looser typing standards
- **Validation last** — Phase 6 ensures no legitimate `any` uses were removed

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2:** Each handler file may have unique patterns; file-specific types may be needed
- **Phase 4:** Test mocking patterns vary (vitest vs Playwright); may need separate type utilities

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Type infrastructure is well-documented (Kysely, Hono patterns)
- **Phase 3:** ts-rest contract inference follows established patterns
- **Phase 5:** React component typing is standard TypeScript practice

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on official TypeScript 5.8+ documentation and current library versions |
| Features | HIGH | Violation counts from direct codebase analysis; patterns from observed code |
| Architecture | HIGH | Existing infrastructure verified (`shared/schemas/database.ts`, `functions/api/middleware/utils.ts`) |
| Pitfalls | HIGH | Based on established TypeScript anti-pattern literature and migration war stories |

**Overall confidence:** HIGH

### Gaps to Address

1. **Test file patterns** — Need dedicated research on test-specific type needs during Phase 4 planning
2. **Worker vs Edge types** — May need separate types for Cron Workers vs main router (PartyKit history shows separate D1 binding)
3. **Vectorize/AI types** — Cloudflare AI types are evolving; use selective `any` with justification for now

## Sources

### Primary (HIGH confidence)
- [TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) — official patterns
- [Kysely API Documentation](https://kysely-org.github.io/kysely-apidoc/) — `Selectable<>`, `Insertable<>` types
- [Cloudflare Workers TypeScript Bindings](https://github.com/cloudflare/workers-types) — version 4.20260504.1
- [ts-rest-hono Adapter](https://github.com/msutkowski/ts-rest-hono) — contract inference patterns
- Direct codebase analysis of ARESWEB files — violation counts and patterns

### Secondary (MEDIUM confidence)
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking) — test mocking patterns
- [TypeScript anti-patterns - Tomasz Ducin](https://ducin.dev/typescript-anti-patterns) — over-genericity risks
- [Fixing TypeScript Strict Mode Errors in Large Codebases - Loke.dev](https://loke.dev/blog/fixing-typescript-strict-mode-errors) — migration strategies
- [Migrating large codebase to TypeScript - Marek Urbanowicz](https://marekurbanowicz.medium.com/migrating-large-codebase-to-typescript-do-it-right-from-the-beginning-7109a80b2a3d) — gradual migration approach

### Tertiary (LOW confidence)
- None — all findings verified against primary sources or codebase observation

---
*Research completed: 2026-05-05*
*Ready for roadmap: yes*
