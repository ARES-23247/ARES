# Phase 30: Test Types - Validation

**Phase:** 30 - Test Types
**Status:** Pending execution
**Date:** 2026-05-05

## Test Plan

### Per-Task Validation
- **Command:** `npm run test -- --reporter=verbose <modified-test-file>`
- **Purpose:** Verify individual test file passes after type migration
- **Gate:** Task must pass before proceeding to next task

### Per-Wave Validation
- **Wave 1 (Infrastructure):** `npm run test -- src/test/utils.tsx src/test/types.ts`
- **Wave 2 (Factories):** `npm run test -- src/test/factories/`
- **Wave 3 (Backend tests):** `npm run test -- functions/api/routes/*.test.ts`
- **Wave 4 (E2E):** `npm run test:e2e`

### Phase Gate Validation
- **Command:** `npm run test:coverage`
- **Thresholds:**
  - Lines: ≥85%
  - Functions: 100%
  - Branches: ≥80%
- **Type check:** `npx tsc --noEmit` must pass with zero errors
- **Lint check:** Zero `@typescript-eslint/no-explicit-any` violations in test files

## Automated Verification Commands

```bash
# Count remaining `any` violations in test files
grep -r ": any\|<any>\|as any" functions/api/routes/*.test.ts --include="*.test.ts" | wc -l

# Verify all test types are exported
grep -q "export.*MockKysely" src/test/types.ts
grep -q "export.*TestEnv" src/test/types.ts
grep -q "export.*MockExecutionContext" src/test/types.ts

# Verify all factories use D1Row types
grep -r "D1Row<" src/test/factories/
```

## Acceptance Tests

| Test ID | Behavior | Command | Expected Result |
|---------|----------|---------|-----------------|
| TEST-01 | Typed mock database utilities | `npm run test -- src/test/utils.tsx` | All tests pass |
| TEST-02 | Typed factory functions | `npm run test -- src/test/factories/` | All tests pass |
| TEST-03 | Backend tests typed | `npm run test -- functions/api/routes/*.test.ts` | All tests pass |
| TEST-04 | Hono context typing | `grep -c ": any" functions/api/routes/*.test.ts` | Returns 0 |

## Success Criteria

1. All 131 `any` violations in test files eliminated
2. `src/test/types.ts` exists with all required exports
3. All factory functions return typed domain types
4. All tests pass without behavior changes
5. Coverage thresholds remain green
6. TypeScript compiles without errors
