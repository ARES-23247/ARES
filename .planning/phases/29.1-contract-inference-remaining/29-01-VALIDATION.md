# Phase 29.1: Remaining Route Contract Inference - Validation

**Phase:** 29.1 - Remaining Route Contract Inference
**Status:** Pending execution
**Date:** 2026-05-05

## Test Plan

### Per-Task Validation
- **Command:** `npx tsc --noEmit <modified-file>`
- **Purpose:** Verify TypeScript compilation after each file migration
- **Gate:** Task must pass before proceeding to next task

### Per-Wave Validation
- **Wave 1:** `npm run test -- functions/api/routes/awards.ts functions/api/routes/entities.ts functions/api/routes/locations.ts functions/api/routes/tasks.ts functions/api/routes/tba.ts functions/api/routes/judges.ts functions/api/routes/users.ts functions/api/routes/posts.ts functions/api/routes/zulip.ts`
- **Wave 2:** `npm run test -- functions/api/routes/inquiries/handlers.ts functions/api/routes/outreach/handlers.ts functions/api/routes/media/handlers.ts`

### Phase Gate Validation
- **Type check:** `npx tsc --noEmit` must pass with zero errors
- **Lint check:** Zero `} as any);` patterns in migrated route files
- **Contract check:** All migrated files import `AppRouteInput` from `shared/types/contracts.ts`
- **Response validation:** All migrated files have `responseValidation: true` option

## Automated Verification Commands

```bash
# Count remaining `} as any);` patterns in route files (should be 0 after phase)
grep -r "} as any);" functions/api/routes/*.ts --include="*.ts" | grep -v test | wc -l

# Verify AppRouteInput imports in migrated files
grep -l "AppRouteInput" functions/api/routes/awards.ts functions/api/routes/entities.ts functions/api/routes/locations.ts functions/api/routes/tasks.ts functions/api/routes/tba.ts functions/api/routes/judges.ts functions/api/routes/users.ts functions/api/routes/posts.ts functions/api/routes/zulip.ts | wc -l

# Verify responseValidation enabled
grep -r "responseValidation: true" functions/api/routes/awards.ts functions/api/routes/entities.ts functions/api/routes/locations.ts functions/api/routes/tasks.ts functions/api/routes/tba.ts functions/api/routes/judges.ts functions/api/routes/users.ts functions/api/routes/posts.ts functions/api/routes/zulip.ts | grep -c "responseValidation: true"
```

## Acceptance Tests

| Test ID | Behavior | Command | Expected Result |
|---------|----------|---------|-----------------|
| ROUTE-01 | Awards route uses contract inference | `grep "AppRouteInput" awards.ts && ! grep "} as any);" awards.ts` | Pass |
| ROUTE-02 | Entities route uses contract inference | `grep "AppRouteInput" entities.ts && ! grep "handlers as any" entities.ts` | Pass |
| ROUTE-03 | Judges route uses contract inference | `grep "AppRouteInput" judges.ts && ! grep "as any" judges.ts` | Pass |
| ROUTE-04 | Users route uses contract inference | `grep "AppRouteInput" users.ts && ! grep "} as any);" users.ts` | Pass |
| ROUTE-05 | Posts route uses contract inference | `grep "AppRouteInput" posts.ts && ! grep ": any" posts.ts` | Pass |
| ROUTE-06 | Zulip route uses contract inference | `grep "AppRouteInput" zulip.ts && ! grep ": any" zulip.ts` | Pass |
| ROUTE-07 | Handler modules use contract inference | `grep "AppRouteInput" inquiries/handlers.ts outreach/handlers.ts media/handlers.ts` | Pass |

## Success Criteria

1. All 11 route files migrated to contract inference
2. Zero `} as any);` patterns in router setup
3. Zero `handlers as any` patterns in router setup
4. Zero `s.router(contract as any, ...)` patterns
5. All migrated files import `AppRouteInput` from `shared/types/contracts.ts`
6. All migrated files have `responseValidation: true` with error handler
7. TypeScript compiles without errors
8. All route tests still pass

## Files Migrated

| Plan | Files | Violations Fixed |
|------|-------|------------------|
| 29.1-01 | awards.ts, entities.ts, locations.ts, tasks.ts, tba.ts | ~15 |
| 29.1-02 | judges.ts, users.ts | ~20 |
| 29.1-03 | posts.ts, zulip.ts | ~15 |
| 29.1-04 | inquiries/, outreach/, media/ | ~10 |

**Total:** 11 route files, ~60 `any` violations eliminated

## Rollback Plan

If a migration breaks compilation:
1. Revert the specific file commit
2. Investigate the contract type mismatch
3. Verify handler signature matches contract
4. Re-apply migration with corrected types
