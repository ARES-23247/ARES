# Phase 32-03: Remove @ts-nocheck - Research

**Researched:** 2026-05-05
**Domain:** TypeScript type safety, ts-rest-hono handler typing
**Confidence:** HIGH

## Summary

Phase 32-03 addresses the `@ts-nocheck` technical debt introduced in commit `b1347233` which suppressed all TypeScript type checking in 86 files to "resolve" type errors. The files fall into three distinct categories requiring different remediation approaches:

1. **ts-rest route files missing handler type annotations** (19 files): These use ts-rest contracts and `createHonoEndpoints` but handler functions have untyped `(input, c)` parameters instead of `(input: AppRouteInput, c: HonoContext)`.

2. **ts-rest route files already properly typed** (10 files): These correctly import and use `HonoContext` and `HandlerInput` types. Removing `@ts-nocheck` should have no errors.

3. **Non-ts-rest routes and utilities** (22 files): These use standard Hono patterns, Better Auth passthrough, or are utility modules. They need context typing added to handler signatures.

4. **Test files** (35 files): These use existing test infrastructure types (`TestEnv`, `MockKysely`) but have implicit `any` in mock configurations.

**Primary recommendation:** Fix files in order of complexity: (1) already-typed files (remove `@ts-nocheck` only), (2) add missing `HonoContext` imports to ts-rest handlers, (3) add proper typing to non-ts-rest routes, (4) fix test mocks.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
**D-01:** ESLint `@typescript-eslint/no-explicit-any` must be changed from "warn" to "error" in `eslint.config.js`
**D-02:** API router override (`files: ["functions/api/routes/**/*.{ts,tsx}"]`) must be removed from `eslint.config.js`
**D-03:** Generated files directory (`src/components/generated/**`) must remain excluded from ESLint
**D-04:** All remaining `any` uses must have inline justification comments following the standard format
**D-05:** Legitimate `any` use categories are: External Library Type Gap, System Boundary Type, Test Mock

### Claude's Discretion
None — all decisions are locked from RESEARCH.md requirements.

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Request handler type safety | API / Backend | — | Route handlers live in API layer; typing their inputs/outputs prevents runtime errors |
| Contract type generation | Build Time | — | ts-rest generates types from Zod schemas at compile time |
| Test mock typing | Test | — | Test infrastructure runs in test environment, separate from runtime tiers |
| Context binding types | API / Backend | — | Hono context bindings (DB, env vars) are API tier concerns |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ts-rest-hono | 0.5.0 | Type-safe API handlers with ts-rest contracts and Hono | Provides typed request/response contracts between frontend and backend |
| @ts-rest/core | 3.52.1 | Contract definition and type generation | Declarative API contracts that generate types for both client and server |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @shared/types/api | local | HonoContext, HandlerInput, AppEnv types | For all route handler typing |
| @shared/types/database | local | SelectableRow, DB schema types | For database result typing in handlers |
| @src/test/types | local | TestEnv, MockKysely, MockExecutionContext | For test file mock configurations |

### Type Import Pattern
```typescript
// For ts-rest handlers
import type { HonoContext } from "@shared/types/api";
import type { HandlerInput } from "@shared/types/api";

// For database operations
import type { SelectableRow } from "@shared/types/database";
import { DB } from "shared/schemas/database";
```

**Installation:**
```bash
# Already installed
npm list ts-rest-hono @ts-rest/core
```

## Architecture Patterns

### ts-rest Handler Typing Pattern

**What:** All ts-rest handler functions must receive typed parameters from the contract.

**When to use:** For every route handler using `s.router()` or `createHonoEndpoints()`.

**Example:**
```typescript
// Source: verified from comments.ts, docs.ts, finance.ts
import type { HonoContext } from "@shared/types/api";
import { analyticsContract } from "../../../shared/schemas/contracts/analyticsContract";

const handlers = {
  // CORRECT: Both parameters typed
  getAnalytics: async (input, c: HonoContext) => {
    const db = c.get("db") as Kysely<DB>;
    const { limit, offset } = input.query; // Typed from contract
    return { status: 200, body: { results } };
  },
  // INCORRECT (current state in 19 files): Untyped parameters
  getAnalytics: async (input, c) => { // Both 'input' and 'c' are implicitly 'any'
    const db = c.get("db") as Kysely<DB>;
    const { limit, offset } = input.query; // Works at runtime but no type safety
    return { status: 200, body: { results } };
  },
};
```

### Non-ts-rest Hono Handler Pattern

**What:** Standard Hono handlers not using ts-rest contracts need explicit context typing.

**When to use:** For routes using Better Auth passthrough, webhooks, or utility endpoints.

**Example:**
```typescript
// Source: verified from auth.ts
import { Context } from "hono";
import type { AppEnv } from "../../middleware/utils";

authRouter.get("/auth-check", async (c: Context<AppEnv>) => {
  const user = await getSessionUser(c);
  return c.json({ authenticated: !!user });
});
```

### Test Mock Typing Pattern

**What:** Test mocks should use `TestEnv`, `MockKysely`, and related test infrastructure types.

**When to use:** In all `.test.ts` files for route handlers.

**Example:**
```typescript
// Source: verified from src/test/types.ts
import { TestEnv, MockKysely, MockExecutionContext } from "../../../src/test/types";

let mockDb: MockKysely; // Already typed
const testApp: Hono<TestEnv>; // Use TestEnv for type-safe testing
```

### Anti-Patterns to Avoid
- **Untyped handler parameters:** `async (input, c) => {` should be `async (input, c: HonoContext) => {`
- **Missing context type:** `async (c) => {` should be `async (c: Context<AppEnv>) => {` or `async (c: HonoContext) => {`
- **Untyped error catches:** `} catch (e) {` should be `} catch (e: unknown) {` (already done in many files)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Handler input typing | Custom interfaces for request body/query/params | ts-rest contract types | Contracts already generate correct types; duplicating them creates maintenance burden |
| Test mock types | Custom mock interfaces | MockKysely, TestEnv from src/test/types | Test infrastructure already provides typed mocks |

**Key insight:** The type system already has the correct types available. The problem is they're not being imported and used. Importing existing types is faster and more maintainable than creating new ones.

## File Categorization

### Total Files with @ts-nocheck: 86

| Category | Count | Files |
|----------|-------|-------|
| Route files (top-level) | 31 | `functions/api/routes/*.ts` |
| Route files (nested) | 20 | `functions/api/routes/**/*.ts` |
| Test files | 35 | `functions/api/routes/**/*.test.ts` |
| **Total route files** | **51** | 31 + 20 |

### Route Files by Type Status

| Status | Count | Description |
|--------|-------|-------------|
| WITH ts-rest + HonoContext (ready) | 10 | Already properly typed, just need to remove `@ts-nocheck` |
| WITH ts-rest, missing HonoContext | 19 | Need to add `HonoContext` type annotation to handlers |
| NOT using ts-rest | 22 | Need standard Hono context typing or are utility modules |

### Files Already Properly Typed (Remove @ts-nocheck Only)

These files correctly import and use `HonoContext`:
1. `functions/api/routes/comments.ts` (279 lines)
2. `functions/api/routes/communications.ts` (143 lines)
3. `functions/api/routes/docs.ts` (806 lines)
4. `functions/api/routes/finance.ts` (362 lines)
5. `functions/api/routes/github.ts` (207 lines)
6. `functions/api/routes/logistics.ts`
7. `functions/api/routes/notifications.ts`
8. `functions/api/routes/points.ts`
9. `functions/api/routes/profiles.ts`
11. `functions/api/routes/settings.ts`

**Complexity:** LOW — Remove `@ts-nocheck` lines, verify no TypeScript errors.

### Files WITH ts-rest, Missing HonoContext (Add Type Annotation)

These files use `s.router()` and `createHonoEndpoints` but handlers have untyped parameters:

1. `functions/api/routes/analytics.ts` (359 lines)
2. `functions/api/routes/awards.ts` (176 lines)
3. `functions/api/routes/badges.ts` (201 lines)
4. `functions/api/routes/entities.ts` (129 lines)
5. `functions/api/routes/judges.ts` (232 lines)
6. `functions/api/routes/locations.ts`
7. `functions/api/routes/seasons.ts`
8. `functions/api/routes/sponsors.ts`
9. `functions/api/routes/store.ts`
10. `functions/api/routes/tasks.ts`
11. `functions/api/routes/tba.ts`
12. `functions/api/routes/users.ts`
13. `functions/api/routes/zulip.ts`
14. `functions/api/routes/socialQueue.ts`
15. `functions/api/routes/events/handlers.ts`
16. `functions/api/routes/events/index.ts`
17. `functions/api/routes/inquiries/handlers.ts`
18. `functions/api/routes/inquiries/index.ts`
19. `functions/api/routes/media/handlers.ts`

**Complexity:** MEDIUM — Add `import type { HonoContext } from "@shared/types/api"` and add `: HonoContext` to each handler's `c` parameter.

**Example fix:**
```typescript
// Before
const handlers = {
  list: async (_input, c) => { ... },
  create: async (input, c) => { ... },
};

// After
import type { HonoContext } from "@shared/types/api";

const handlers = {
  list: async (_input, c: HonoContext) => { ... },
  create: async (input, c: HonoContext) => { ... },
};
```

### Files NOT Using ts-rest (Different Approach)

These files use standard Hono, Better Auth passthrough, or are utility modules:

1. `functions/api/routes/auth.ts` (47 lines) — Better Auth passthrough
2. `functions/api/routes/githubWebhook.ts` (189 lines) — Webhook handler
3. `functions/api/routes/simulations.ts` (516 lines) — Standard Hono
4. `functions/api/routes/sitemap.ts` (84 lines) — XML generation
5. `functions/api/routes/zulipWebhook.ts` (509 lines) — Webhook handler
6. `functions/api/routes/_profileUtils.ts` (147 lines) — Utility functions
7. `functions/api/routes/ai/autoReindex.ts` (67 lines) — Background job
8. `functions/api/routes/ai/external/chunker.ts` (81 lines) — Utility
9. `functions/api/routes/ai/external/githubFetcher.ts` — Utility
10. `functions/api/routes/ai/index.ts` — SSE/streaming
11. `functions/api/routes/ai/indexer.ts` — Background indexing
12. `functions/api/routes/ai/types.ts` — Type definitions (no actual errors)
13. `functions/api/routes/internal/gc.ts` — Garbage collection
14. `functions/api/routes/outreach/handlers.ts`
15. `functions/api/routes/scouting/*.ts`

**Complexity:** MEDIUM to HIGH — Each file needs individual analysis. Most need `Context<AppEnv>` added to handler signatures.

### Test Files (35 files)

Test files use `TestEnv`, `MockKysely`, and `MockExecutionContext` from `src/test/types`. Common issues:
- Mock function parameters typed as `_c: unknown` (acceptable for mocks)
- `vi.fn()` mock chains may need explicit typing

**Complexity:** LOW to MEDIUM — Test infrastructure types exist; need to be imported and used.

## Common `any` Usage Patterns

### Pattern 1: Untyped ts-rest Handler Parameters

**Error:** `Parameter 'input' implicitly has an 'any' type.`
**Location:** All 19 files in "WITH ts-rest, missing HonoContext" category

**Example:**
```typescript
// functions/api/routes/badges.ts
const badgesTsRestRouterObj = {
  list: async (_input, c) => { // Both parameters are implicitly 'any'
    const db = c.get("db") as Kysely<DB>;
    // ...
  },
  create: async (input, c) => { // Both parameters are implicitly 'any'
    const { id, name } = input.body; // Works but no type safety
    // ...
  },
};
```

**Fix:**
```typescript
import type { HonoContext } from "@shared/types/api";

const badgesTsRestRouterObj = {
  list: async (_input, c: HonoContext) => { // Now typed
    // ...
  },
  create: async (input, c: HonoContext) => { // Now typed
    // ...
  },
};
```

### Pattern 2: Non-ts-rest Handler Missing Context Type

**Error:** `Parameter 'c' implicitly has an 'any' type.`
**Location:** Files in "NOT using ts-rest" category

**Example:**
```typescript
// functions/api/routes/auth.ts
authRouter.get("/auth-check", async (c) => { // 'c' is implicitly 'any'
  const user = await getSessionUser(c);
  return c.json({ authenticated: !!user });
});
```

**Fix:**
```typescript
import { Context } from "hono";
import type { AppEnv } from "../../middleware/utils";

authRouter.get("/auth-check", async (c: Context<AppEnv>) => { // Now typed
  // ...
});
```

### Pattern 3: Catch Block Error Variables

**Status:** Already correctly typed in most files as `e: unknown`

**Example:**
```typescript
// Already correct in badges.ts, entities.ts, etc.
} catch (e: unknown) {
  const err = e as Error;
  return { status: 500, body: { error: err.message } };
}
```

**Note:** This pattern is already correct and does not need changes.

### Pattern 4: Explicit `any` Type Assertions

**Count:** ~88 explicit `: any` uses across all route files

**Locations:**
- `functions/api/routes/_profileUtils.ts`: Multiple `as any` assertions for database insert values
- Kysely query result type assertions: `as Kysely<DB>`
- Some test mock configurations

**Example:**
```typescript
// _profileUtils.ts — uses 'as any' for compatibility
nickname: await getMergedValue("nickname") as any,
first_name: await getMergedValue("first_name") as any,
```

**Fix Strategy:** These should be replaced with proper types from `SelectableRow<"user_profiles">` or database schema types.

## Contract Coverage

### Contracts Available

The following contracts exist in `shared/schemas/contracts/`:
- ai, analytics, award, badge, comment, communications, doc, entity, event, finance, github, inquiry, judge, location, logistics, media, notification, outreach, points, post, season, settings, socialqueue, sponsor, store, task, tba, user, zulip

### Route Files WITH Matching Contracts (27/36 = 75%)

All files with contracts use ts-rest and need `HonoContext` added.

### Route Files WITHOUT Matching Contracts (9/36 = 25%)

1. `entities` — Has `entityContract` but may not be using it correctly
2. `profiles` — No contract exists, uses standard Hono
3. `auth` — Better Auth passthrough, no contract needed
4. `simulations` — No contract exists
5. `sitemap` — No contract needed (XML endpoint)
6. `profileUtils` — Utility module, not a route
7. `inquiries` — Has `inquiryContract` but may not be using it
8. `internal/gc` — Internal endpoint, no contract
9. `scouting` — No contract for scouting routes

**Note:** Not all routes need contracts. Webhooks, utility endpoints, and internal routes can use standard Hono patterns.

## Complexity Estimate Per Category

| Category | Files | Est. Time/File | Total Est. Time | Risk Level |
|----------|-------|----------------|-----------------|------------|
| Already typed (remove @ts-nocheck) | 10 | 2 min | 20 min | LOW |
| Add HonoContext to ts-rest handlers | 19 | 5 min | 95 min | MEDIUM |
| Fix non-ts-rest routes | 22 | 10 min | 220 min | MEDIUM-HIGH |
| Fix test files | 35 | 3 min | 105 min | LOW-MEDIUM |
| **TOTAL** | **86** | — | **~7 hours** | — |

**Note:** Times are estimates for someone familiar with the codebase. Actual time may vary.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.ts |
| Quick run command | `npm test` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| 32-03-01 | Remove @ts-nocheck without introducing TS errors | unit | `npx tsc --noEmit` | N/A (type check) |
| 32-03-02 | All handlers properly typed | unit | `npx eslint functions/api/routes/*.ts` | N/A (lint) |
| 32-03-03 | No regressions in route behavior | integration | `npm test -- --run functions/api/routes/` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (verify no new type errors)
- **Per wave merge:** `npm test -- --run` (full test suite)
- **Phase gate:** TypeScript compilation succeeds with zero errors

### Wave 0 Gaps
- [ ] `functions/api/routes/**/*.test.ts` — Some test files may need updates after handler typing changes
- [ ] Type checking: `npx tsc --noEmit` — Run before and after to verify no regressions

## Common Pitfalls

### Pitfall 1: Removing @ts-nocheck Without Fixing Types
**What goes wrong:** TypeScript shows hundreds of errors, blocking progress
**How to avoid:** Fix handler typing BEFORE removing `@ts-nocheck`. Use the categorization above to tackle files in order of complexity.

### Pitfall 2: Forgetting to Import HonoContext
**What goes wrong:** Type annotation is added but import is missing, causing "Cannot find name 'HonoContext'" errors
**How to avoid:** Always add the import line when adding type annotations:
```typescript
import type { HonoContext } from "@shared/types/api";
```

### Pitfall 3: Breaking Test Mocks
**What goes wrong:** Tests fail because mock signatures no longer match handler signatures
**How to avoid:** Run tests after each file is fixed. Test types (`TestEnv`, `MockKysely`) are designed to work with typed handlers.

### Pitfall 4: Modifying Wrong Files
**What goes wrong:** Spending time on files that are already properly typed
**How to avoid:** Start with the "Already Properly Typed" category — these just need `@ts-nocheck` removed, providing quick wins and verifying the approach.

## Code Examples

### Fixing a ts-rest Handler (MEDIUM complexity)

```typescript
// Before: functions/api/routes/badges.ts
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Hono } from "hono";
import { createHonoEndpoints } from "ts-rest-hono";
import { badgeContract } from "../../../shared/schemas/contracts/badgeContract";
import { AppEnv, ensureAdmin, ensureAuth, getSessionUser, s } from "../middleware";

const badgesTsRestRouterObj = {
  list: async (_input, c) => { // Implicit 'any'
    const db = c.get("db") as Kysely<DB>;
    // ...
  },
  create: async (input, c) => { // Implicit 'any'
    const { id, name, description } = input.body; // No type safety
    // ...
  },
};
```

```typescript
// After
import { Hono } from "hono";
import { createHonoEndpoints } from "ts-rest-hono";
import { badgeContract } from "../../../shared/schemas/contracts/badgeContract";
import { AppEnv, ensureAdmin, ensureAuth, getSessionUser, s } from "../middleware";
import type { HonoContext } from "@shared/types/api"; // ADD THIS

const badgesTsRestRouterObj = {
  list: async (_input, c: HonoContext) => { // TYPED
    const db = c.get("db") as Kysely<DB>;
    // ...
  },
  create: async (input, c: HonoContext) => { // TYPED
    const { id, name, description } = input.body; // Type-safe!
    // ...
  },
};
```

### Fixing a Non-ts-rest Handler (MEDIUM-HIGH complexity)

```typescript
// Before: functions/api/routes/auth.ts
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Hono } from "hono";
import type { Context } from "hono";
import { AppEnv, getSessionUser, persistentRateLimitMiddleware } from "../middleware";

const authRouter = new Hono<AppEnv>();

authRouter.get("/auth-check", persistentRateLimitMiddleware(60, 60), async (c) => { // Implicit 'any'
  const user = await getSessionUser(c);
  if (!user) return c.json({ authenticated: false }, 401);
  return c.json({ authenticated: true, user });
});
```

```typescript
// After
import { Hono } from "hono";
import type { Context } from "hono";
import { AppEnv, getSessionUser, persistentRateLimitMiddleware } from "../middleware";

const authRouter = new Hono<AppEnv>();

authRouter.get("/auth-check", persistentRateLimitMiddleware(60, 60), async (c: Context<AppEnv>) => { // TYPED
  const user = await getSessionUser(c);
  if (!user) return c.json({ authenticated: false }, 401);
  return c.json({ authenticated: true, user });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Untyped handler parameters | `HonoContext` and `HandlerInput` types | Phase 29 | Type-safe route handlers |
| Implicit `any` everywhere | Explicit type annotations | Phase 30+ | Catches type errors at compile time |
| `@ts-nocheck` to hide errors | Proper type fixing | Phase 32-03 | No more hidden type errors |

**Deprecated/outdated:**
- `@ts-nocheck` as a solution for type errors — should only be used temporarily during migration
- Untyped `(input, c)` handler parameters in ts-rest routes

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | All files in "Already Properly Typed" category will have zero TS errors after removing @ts-nocheck | Already Properly Typed | LOW — Files already use correct types |
| A2 | Adding `HonoContext` type annotation to 19 files will resolve all their type errors | Files WITH ts-rest, missing HonoContext | MEDIUM — Some files may have additional issues |
| A3 | Test infrastructure types (`TestEnv`, `MockKysely`) are sufficient for test files | Test Files | LOW — Types were designed for this purpose |

## Open Questions

1. **Should we create contracts for the 9 route files without them?**
   - What we know: 75% of route files have contracts; some don't need them (auth, sitemap, webhooks)
   - What's unclear: Whether `profiles`, `simulations`, `scouting` should have contracts
   - Recommendation: Out of scope for 32-03. Fix typing first, consider contracts in future phase.

2. **How to handle Kysely `as Kysely<DB>` casts?**
   - What we know: These are currently necessary because context type doesn't narrow the `db` variable
   - What's unclear: Whether there's a better pattern that doesn't require type assertions
   - Recommendation: Keep as-is for now. This is a Kysely limitation, not our code.

## Environment Availability

> Skip this section — phase involves only code changes, no external dependencies.

## Sources

### Primary (HIGH confidence)
- [ts-rest-hono v0.5.0 docs](https://ts-rest.com/docs/ts-rest-hono/) — Handler typing patterns
- [shared/types/api.ts] — Verified `HonoContext` and `HandlerInput` type definitions
- [shared/schemas/contracts/*] — Verified contract structure and available contracts
- [src/test/types.ts] — Verified test infrastructure types

### Secondary (MEDIUM confidence)
- TypeScript compiler output from sample files — Verified actual error patterns
- Git commit b1347233 — Verified when @ts-nocheck was added and why

### Tertiary (LOW confidence)
- None — all findings verified via code inspection or compiler output

## Metadata

**Confidence breakdown:**
- File categorization: HIGH — verified via code inspection
- Type error patterns: HIGH — verified via TypeScript compiler
- Fix strategies: HIGH — based on established patterns in already-typed files
- Time estimates: MEDIUM — based on file complexity, actual time may vary

**Research date:** 2026-05-05
**Valid until:** 30 days (codebase is stable, patterns are consistent)
