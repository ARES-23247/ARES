# Phase 32: Final Validation - Validation

**Phase:** 32 - Final Validation
**Status:** Pending execution (depends on Phases 30-31)
**Date:** 2026-05-05

## Execution Context

**IMPORTANT:** This phase must execute AFTER Phases 30 and 31 complete. The violation counts below assume those phases have eliminated their targeted violations.

## Pre-Execution Baseline (Current)

```bash
# Current state before any v6.7 phases execute
npx eslint --rule "@typescript-eslint/no-explicit-any: error" **/*.{ts,tsx}
# Result: 747 violations across 68 files
```

## Post-Phase 30-31 Projection (Expected)

| Phase | Target | Expected Remaining |
|-------|--------|-------------------|
| 30 | Test files (131 violations) | 0 |
| 31 | Components (20 violations) | 0 |
| 29 | Routes with `as any` (21 files) | 21 (addressed in 32-03 if needed) |
| **Total Expected** | | ~20-30 legitimate uses |

## Per-Task Validation

- **Plan 32-01 Task 1:** ESLint config change — verify config syntax valid
- **Plan 32-01 Task 2:** Remove override — verify no unintended exclusions
- **Plan 32-01 Task 3:** Run ESLint — capture baseline count
- **Plan 32-02 Task 1:** Audit violations — categorize all remaining
- **Plan 32-02 Tasks 2-6:** Add justifications — verify format

## Per-Wave Validation

- **Wave 1:** `npx tsc --noEmit` after ESLint config change
- **Wave 2:** `npm run lint` verifies all remaining violations have justifications

## Phase Gate Validation

1. ESLint rule is "error" (not "warn")
2. API router override removed
3. All remaining `any` uses have `eslint-disable-next-line` with justification
4. Generated files (`src/components/generated/**`) remain excluded
5. `npx tsc --noEmit` passes
6. `npm run test` passes

## Automated Verification Commands

```bash
# Verify ESLint rule is set to error
grep -A5 "no-explicit-any" eslint.config.js | grep -q '"error"'

# Verify API router override is removed
! grep -q "functions/api/routes" eslint.config.js

# Count violations with justifications vs without
WITH=$(grep -r "eslint-disable-next-line.*no-explicit-any" src/ --include="*.ts" --include="*.tsx" | wc -l)
WITHOUT=$(npx eslint --rule "@typescript-eslint/no-explicit-any: error" **/*.{ts,tsx} 2>&1 | grep -c "no-explicit-any" || echo 0)
echo "Justified: $WITH, Unjustified: $WITHOUT"
```

## Success Criteria

1. ESLint `@typescript-eslint/no-explicit-any` is set to "error"
2. API router override block removed from eslint.config.js
3. All remaining `any` uses have justification comments
4. Generated files remain excluded via ESLint ignores
5. TypeScript compilation passes
6. All tests pass
7. Final violation count documented (<30 expected)

## Rollback Plan

If ESLint enforcement breaks the build:
1. Revert eslint.config.js to "warn" level
2. Investigate files with new violations
3. Add justifications or fix types
4. Re-enable enforcement
