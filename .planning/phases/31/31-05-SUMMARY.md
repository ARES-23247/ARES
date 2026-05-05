---
phase: 31-frontend-components
plan: 05
subsystem: Frontend Type Safety
tags: [typescript, window-globals, playwright]
dependency_graph:
  requires: []
  provides: [COMP-07]
  affects: []
tech_stack:
  added: []
  patterns: [Window interface augmentation]
key_files:
  created:
    - path: src/types/window.d.ts
      description: Window interface augmentation for Playwright test globals
  modified:
    - path: src/components/editor/CollaborativeEditorRoom.tsx
      description: Removed as any assertions for Window globals
    - path: src/components/TaskBoardPage.tsx
      description: Removed as any assertions for Window globals
decisions: []
metrics:
  duration: 111s
  completed_date: "2026-05-05"
---

# Phase 31 Plan 05: Window Globals Type Safety Summary

Eliminated all `(window as any)` assertions for Playwright test globals by creating a proper Window interface augmentation.

## One-Liner

Created `src/types/window.d.ts` with `__PLAYWRIGHT_TEST__` property and updated CollaborativeEditorRoom.tsx and TaskBoardPage.tsx to use typed Window globals.

## Deviations from Plan

None - plan executed exactly as written.

## Tasks Completed

### Task 1: Create Window interface augmentation
- Created `src/types/window.d.ts` with `declare global` block
- Added `readonly __PLAYWRIGHT_TEST__?: true` property to Window interface
- Used `export {}` to make the file a module
- Added JSDoc documentation
- **Commit**: `64e40cf3`

### Task 2: Fix Window type assertions in CollaborativeEditorRoom and TaskBoardPage
- Replaced all `(window as any).__PLAYWRIGHT_TEST__` with `window.__PLAYWRIGHT_TEST__`
- Fixed connection-error callback type from `any` to `Error | unknown`
- Updated 3 locations in CollaborativeEditorRoom.tsx (lines 154, 170, 343)
- Updated 1 location in TaskBoardPage.tsx (line 151)
- **Commit**: `7287f36e`

## Verification Results

- TypeScript compilation succeeds (no new errors related to window.d.ts)
- Zero `(window as any)` assertions remain in both files
- `window.__PLAYWRIGHT_TEST__` is properly typed and accessible
- Test mode detection preserves existing behavior

## Threat Flags

None - test-only flag with no security impact.

## Self-Check: PASSED

- [x] `src/types/window.d.ts` exists and is syntactically correct
- [x] Commit `64e40cf3` exists
- [x] Commit `7287f36e` exists
- [x] Zero `(window as any)` violations in target files
- [x] Test mode detection logic preserved

## Requirements Completed

- **COMP-07**: Window interface augmentation for Playwright test globals created
