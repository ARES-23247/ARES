---
phase: 27-type-foundation
plan: 01
subsystem: types
tags: [typescript, kysely, hono, ts-rest, type-safety]

# Dependency graph
requires:
  - phase: 26
    provides: Kysely DB schema, Hono middleware types
provides:
  - D1Row<T> generic for type-safe database row access
  - HonoContext branded type with ARES AppEnv
  - HandlerInput/HandlerOutput types for API contracts
  - ContractHandler<T> foundation for ts-rest integration
  - Utility types (ValueOf, Optional, Nullable, Prettify)
affects: [28, 29, 30, 31, 32, 33, 34]

# Tech tracking
tech-stack:
  added: [ts-rest/core@3.52.1 (existing, now typed)]
  patterns:
    - Barrel export pattern for type imports
    - Branded HonoContext to avoid circular deps
    - Kysely Selectable/Insertable/Updateable wrapper types

key-files:
  created: [shared/types/database.ts, shared/types/api.ts, shared/types/contracts.ts, shared/types/utility.ts, shared/types/index.ts]
  modified: []

key-decisions:
  - "D1Row<T> uses Selectable directly instead of custom unwrapping - simpler, maintains type safety"
  - "ts-rest types use AppRoute (correct export) instead of ApiRoute - matches v3.52.1 API"
  - "AppEnv re-exported from middleware to avoid redefinition and circular dependencies"

patterns-established:
  - "Type files import only from schema layer or external packages - no internal circular deps"
  - "All types limited to <=2 generics and <=5 lines per definition"
  - "Barrel export enables clean imports from shared/types"

requirements-completed: [ANTI_PATTERN_1, ANTI_PATTERN_5, FOUNDATION_CHECKLIST]

# Metrics
duration: 5min
completed: 2026-05-05
---

# Phase 27 Plan 01: Type Foundation Summary

**Shared type infrastructure with D1Row generic, Hono context branding, and ts-rest contract utilities for eliminating 983 `any` violations**

## Performance

- **Duration:** 5 min
- **Started:** 2025-05-05T12:51:53Z
- **Completed:** 2025-05-05T12:56:58Z
- **Tasks:** 5
- **Files created:** 5

## Accomplishments

- Created `shared/types/` directory with five type files forming the foundation for type-safe development
- Established `D1Row<T>` generic for database row types using Kysely Selectable
- Branded `HonoContext` type with ARES AppEnv (Bindings/Variables) without circular dependencies
- Defined `HandlerInput<TBody, TParams>` and `HandlerOutput<TBody>` for API handler contracts
- Added ts-rest `ContractHandler<T>` utilities prepared for Phase 29 integration
- Exported all types via barrel import for clean `import { D1Row, HandlerInput } from "shared/types"`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared/types/database.ts with D1Row generic** - `a81c585` (feat)
2. **Task 2: Create shared/types/api.ts with HonoContext and handler types** - `1593053` (feat)
3. **Task 3: Create shared/types/contracts.ts for ts-rest utilities** - `5ec6d62` (feat)
4. **Task 4: Create shared/types/utility.ts with helper types** - `ee6ddd7` (feat)
5. **Task 5: Create shared/types/index.ts barrel export with ESLint verification** - `c67be6c` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `shared/types/database.ts` - D1Row, SelectableRow, InsertableRow, UpdateableRow types for Kysely D1 integration
- `shared/types/api.ts` - HonoContext, HandlerInput, HandlerOutput, AppEnv for Hono API handlers
- `shared/types/contracts.ts` - ContractHandler, ContractInput, ContractResponse for ts-rest contract inference
- `shared/types/utility.ts` - ValueOf, Optional, Nullable, Prettify helper types
- `shared/types/index.ts` - Barrel export enabling `import { D1Row, HandlerInput } from "shared/types"`

## Created Type Signatures

**database.ts:**
```typescript
export type D1Row<T extends keyof DB> = Selectable<DB[T]>;
export type SelectableRow<T extends keyof DB> = Selectable<DB[T]>;
export type InsertableRow<T extends keyof DB> = Insertable<DB[T]>;
export type UpdateableRow<T extends keyof DB> = Updateable<DB[T]>;
```

**api.ts:**
```typescript
export type HonoContext = Context<AppEnv>;
export type HandlerInput<TBody = unknown, TParams extends Record<string, string> = Record<string, string>> = { body: TBody; query: Record<string, string>; params: TParams; };
export type HandlerOutput<TBody = unknown> = { status: number; body: TBody; };
```

**contracts.ts:**
```typescript
export type ContractHandler<T extends AppRoute> = (input: ContractInput<T>, c: HonoContext) => Promise<ContractResponse<T>>;
```

**utility.ts:**
```typescript
export type ValueOf<T> = T[keyof T];
export type Optional<T> = T | null | undefined;
export type Nullable<T> = T | null;
export type Prettify<T> = { [K in keyof T]: T[K] } & {};
```

## Decisions Made

1. **D1Row uses Selectable directly** - Initially planned to unwrap Generated<> with Omit/Pick pattern, but Selectable already provides the runtime type correctly. Simpler implementation with same effect.
2. **ts-rest uses AppRoute not ApiRoute** - @ts-rest/core@3.52.1 exports `AppRoute` not `ApiRoute`. Used correct type name.
3. **AppEnv re-exported from middleware** - Avoids redefinition and potential circular dependency. Single source of truth for environment types.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect ts-rest imports**
- **Found during:** Task 3 (Create contracts.ts)
- **Issue:** Plan specified `ApiRoute` and `ApiResponses` from @ts-rest/core, but v3.52.1 exports `AppRoute` instead. TypeScript compilation failed with "no exported member" errors.
- **Fix:** Changed imports to use `AppRoute` and inferred `ContractResponse` directly from contract `responses` property using conditional type.
- **Files modified:** shared/types/contracts.ts
- **Verification:** TypeScript compiles without errors, ts-rest types resolve correctly
- **Committed in:** 5ec6d62 (Task 3 commit)

**2. [Rule 1 - Bug] Fixed Kysely types import**
- **Found during:** Task 1 (Create database.ts)
- **Issue:** Plan specified importing `Selectable`, `Insertable`, `Updateable` from `../schemas/database`, but these types come from the `kysely` package, not the generated schema.
- **Fix:** Added `import type { Selectable, Insertable, Updateable } from "kysely"` while keeping `DB` and `Generated` from the generated schema.
- **Files modified:** shared/types/database.ts
- **Verification:** TypeScript compiles, Kysely types resolve correctly
- **Committed in:** a81c585 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed Generated<> keyof type error**
- **Found during:** Task 1 (Create database.ts)
- **Issue:** Attempted `Omit<Selectable<DB[T]>, keyof Generated>` but TypeScript doesn't allow using `keyof Generated<unknown>` as a key omission list because Generated<> needs a concrete type argument.
- **Fix:** Simplified `D1Row<T>` to use `Selectable<DB[T]>` directly, which already provides the correct runtime types (unwrapping Generated<> at usage site).
- **Files modified:** shared/types/database.ts
- **Verification:** TypeScript compiles, type produces expected runtime types
- **Committed in:** a81c585 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 - Bug fixes for import/type errors)
**Impact on plan:** All auto-fixes were necessary for TypeScript compilation. No scope creep - same deliverables achieved.

## Verification Results

### Compilation Checks
- All five type files compile without errors: `npx tsc --noEmit --skipLibCheck --ignoreConfig shared/types/*.ts`
- Barrel export compiles correctly: imports resolve to all exported types

### Complexity Constraints
- Generic parameters per type: All types have 1-2 generics (within <=2 limit)
- Lines per definition: All type definitions are 1-3 lines (within <=5 limit)
- Circular dependencies: Zero - `grep` shows only comment references to "shared/types" within the directory

### ESLint Configuration
- Verified `eslint.config.js` line 121: `@typescript-eslint/no-explicit-any: "off"` for `functions/api/routes/**/*`
- This intentional disable allows gradual migration during Phase 28+

## Known Limitations

1. **D1Row runtime nulls** - While `D1Row<T>` provides the type signature, Kysely's Generated<> unwrapping may still produce `null` at runtime for auto-generated columns. Route handlers should add runtime validation (Phase 29 Zod integration).
2. **ContractResponse inference** - Current `ContractResponse<T>` uses simple conditional type inference. Phase 29 may need more sophisticated inference for complex response unions.

## Import Examples for Phase 28 Route Handlers

```typescript
// Import all types from single barrel
import { D1Row, HandlerInput, HandlerOutput, HonoContext } from "shared/types";

// Use D1Row for database result typing
type Sponsor = D1Row<"sponsors">; // { id: string, name: string, tier: string, ... }

// Use HandlerInput for request typing
interface CreateSponsorInput extends HandlerInput<SponsorCreateBody, {}> {}

// Use HandlerOutput for response typing
interface SponsorListOutput extends HandlerOutput<Sponsor[]> {}

// Use HonoContext in handlers
export async function getSponsors(c: HonoContext) {
  const db = c.get("db");
  // ...
}
```

## Issues Encountered

None - all issues resolved via deviation rules during execution.

## Next Phase Readiness

- Type infrastructure complete and verified
- Phase 28 (Route Handler Fixes) can import `D1Row`, `HandlerInput`, `HandlerOutput`, `HonoContext` immediately
- Phase 29 (Zod Validation) can leverage `ContractHandler<T>` foundation
- No blockers or concerns

---
*Phase: 27-type-foundation*
*Completed: 2025-05-05*
