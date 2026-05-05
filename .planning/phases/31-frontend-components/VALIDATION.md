# Phase 31: Frontend Components - Validation

**Phase:** 31 - Frontend Components
**Status:** Pending execution
**Date:** 2026-05-05

## Test Plan

### Per-Task Validation
- **Command:** `npm run test -- --reporter=verbose <modified-component-file>`
- **Purpose:** Verify component renders correctly after type migration
- **Gate:** Task must pass before proceeding to next task

### Per-Wave Validation
- **Wave 1:** `npm run test -- src/components/BadgeManager.tsx src/components/ErrorBoundary.tsx src/components/kanban/GenericKanbanBoard.tsx`
- **Wave 2:** `npm run test -- src/components/FinanceManager.tsx src/pages/Blog.tsx src/components/SimulationPlayground.tsx`
- **Wave 3:** `npm run test -- src/components/editor/CollaborativeEditorRoom.tsx`

### Phase Gate Validation
- **Type check:** `npx tsc --noEmit` must pass with zero errors
- **Lint check:** Zero `@typescript-eslint/no-explicit-any` violations in non-test component files
- **Visual smoke test:** Core components render without console errors

## Automated Verification Commands

```bash
# Count remaining `any` violations in component files (excluding tests)
grep -r ": any\|<any>\|as any" src/components/*.tsx src/pages/*.tsx --include="*.tsx" | grep -v ".test.tsx" | wc -l

# Verify icon utility exports
grep -q "export.*getLucideIcon" src/types/components.ts
grep -q "export.*IconComponent" src/types/components.ts

# Verify Window interface augmentation
grep -q "interface Window" src/types/window.d.ts
```

## Acceptance Tests

| Test ID | Behavior | Command | Expected Result |
|---------|----------|---------|-----------------|
| COMP-01 | Icon lookup returns valid component | Manual: BadgeManager renders with valid icons | No console errors |
| COMP-02 | Generic component accepts valid icons | Manual: Kanban board renders with icon props | No console errors |
| COMP-03 | Error boundary handles unknown errors | `npm run test -- src/components/ErrorBoundary.tsx` | Tests pass |
| COMP-05 | Monaco callbacks properly typed | Manual: SimulationPlayground loads without errors | No TS errors |
| COMP-06 | API response types from contracts | `npm run test -- src/components/FinanceManager.tsx` | Tests pass |
| COMP-07 | Playwright globals properly typed | `npm run test -- src/components/editor/CollaborativeEditorRoom.tsx` | Tests pass |

## Success Criteria

1. `src/types/components.ts` exists with IconComponent type and getLucideIcon utility
2. Zero `any` violations in BadgeManager.tsx
3. Zero `any` violations in GenericKanbanBoard.tsx
4. Zero `any` violations in ErrorBoundary.tsx
5. Zero `any` violations in FinanceManager.tsx
6. Zero `any` violations in Blog.tsx
7. Zero `any` violations in SimulationPlayground.tsx
8. Zero `any` violations in CollaborativeEditorRoom.tsx
9. All existing tests still pass
10. TypeScript compiles without errors

## Component Files Fixed

| File | Violations | Pattern | Plan |
|------|------------|---------|------|
| BadgeManager.tsx | 1 | Icon lookup | 31-01 |
| GenericKanbanBoard.tsx | 1 | Icon prop | 31-01 |
| ErrorBoundary.tsx | 1 | Error type | 31-02 |
| FinanceManager.tsx | 2 | Contract types | 31-03 |
| Blog.tsx | 2 | Contract types | 31-03 |
| SimulationPlayground.tsx | 9 | Monaco callbacks | 31-04 |
| CollaborativeEditorRoom.tsx | 4 | Window globals | 31-05 |
| TiptapRenderer.tsx | 1 | Editor types | Out of scope (third-party) |

**Total violations addressed:** 20 across 7 component files
