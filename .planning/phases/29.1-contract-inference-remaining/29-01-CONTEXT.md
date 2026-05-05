# Phase 29.1: Remaining Route Contract Inference - Context

**Created:** 2026-05-05
**Status:** Planning

## Goal

Migrate the remaining 11 route files to ts-rest contract inference, eliminating `as any` casts from router setup and enabling runtime response validation.

## Context from Phase 29

Phase 29 successfully migrated 15 route files (analytics.ts reference + 14 production routes) to contract inference. The pattern is proven and documented. However, 11 additional route files were not included in Phase 29 scope:

**Inline handlers (9 files):**
- awards.ts
- entities.ts
- judges.ts
- locations.ts
- posts.ts
- tasks.ts
- tba.ts
- users.ts
- zulip.ts

**Handler modules (3 directories):**
- inquiries/handlers.ts, inquiries/index.ts
- outreach/handlers.ts, outreach/index.ts
- media/handlers.ts, media/index.ts

## Current Violation Patterns

All 11 files have one or more of these issues:

1. **`as any` cast in router setup** - `s.router(contract as any, handlers as any)` or `const router: any = s.router(...)`
2. **Explicit type annotations on handlers** - `{ body }: { body: any }`, `c: Context<AppEnv>` instead of inferred `(input, c)`
3. **Missing response validation** - No `responseValidation: true` option in `createHonoEndpoints()`
4. **Handler module type casting** - `export const handlers: any = { ... }`

## Migration Pattern (Proven in Phase 29)

### Step 1: Add AppRouteInput import
```typescript
import type { AppRouteInput } from "../../../shared/types/contracts";
```

### Step 2: Remove explicit type annotations from handlers
```typescript
// BEFORE
handler: async ({ body }: { body: any }, c: Context<AppEnv>) => {

// AFTER
handler: async (input, c) => {
  const { field } = input.body;
```

### Step 3: Remove `as any` cast from router setup
```typescript
// BEFORE
const router = s.router(contract as any, handlers as any);

// AFTER
const router = s.router(contract, handlers);
```

### Step 4: Enable response validation
```typescript
// BEFORE
createHonoEndpoints(contract, router, app);

// AFTER
createHonoEndpoints(
  contract,
  router,
  app,
  {
    responseValidation: true,
    responseValidationErrorHandler: (err, _c) => {
      console.error('[Contract] Response validation failed:', err.cause);
      return { error: { message: 'Internal server error' }, status: 500 };
    }
  }
);
```

## Dependencies

- Phase 29 provides the migration pattern
- `shared/types/contracts.ts` already exports `AppRouteInput`, `AppRouteImplementation`
- All contracts already exist and export their types (added in Phase 29-02)

## User Decisions

**Locked Decisions:**
- Apply the Phase 29 migration pattern exactly (no deviations)
- All 11 files must be migrated
- Response validation must be enabled on all routes

**Claude's Discretion:**
- Wave structure and task grouping
- Test execution strategy per task/plan
