# Phase 31: Frontend Components - Context

**Created:** 2026-05-05
**Status:** Locked for execution

## Goal

Eliminate all `@typescript-eslint/no-explicit-any` violations in React components and hooks through proper prop interfaces and event handler types.

## Research Summary

Based on `31-RESEARCH.md`, the codebase contains **7 non-test component files** with **19+ `any` violations** across these patterns:

1. **Lucide Icon Dynamic Lookups** (`BadgeManager.tsx`)
   - Pattern: `(LucideIcons as unknown as Record<string, React.ElementType>)[iconName] as any`
   - Solution: Type-safe icon utility with `keyof typeof LucideIcons`

2. **Monaco Editor Callbacks** (`SimulationPlayground.tsx`)
   - Pattern: `(editor: any, monaco: any) => void`
   - Solution: Use `monaco-editor` package types (`editor.IStandaloneCodeEditor`)

3. **Error Boundary Error Types** (`ErrorBoundary.tsx`)
   - Pattern: `getDerivedStateFromError(error: any)`
   - Solution: Use `unknown` with type narrowing

4. **Generic Component Icon Props** (`GenericKanbanBoard.tsx`)
   - Pattern: `icon: any;` in props interface
   - Solution: `React.ComponentType<{ className?: string; size?: number }>`

5. **Mutation Type Assertions** (`FinanceManager.tsx`, `Blog.tsx`)
   - Pattern: `as any` for API mutation payloads
   - Solution: Proper contract types from ts-rest

6. **Playwright Test Globals** (`CollaborativeEditorRoom.tsx`)
   - Pattern: `(window as any).__PLAYWRIGHT_TEST__`
   - Solution: Global window augmentation

## Locked Decisions

1. **Type Utility Location**: Create `src/types/components.ts` for shared component type utilities
2. **Icon Helper Pattern**: Use type guard function for Lucide icon lookups
3. **Monaco Types**: Import from `monaco-editor` package (not `@monaco-editor/react`)
4. **Error Boundary**: Use `unknown` with type narrowing (not `Error` directly)
5. **Generic Icons**: Use `React.ComponentType` with common props interface

## Requirements Traceability

| Req ID | Description | Source |
|--------|-------------|--------|
| COMP-01 | Icon lookup returns valid component or null | Research.md Pattern 1 |
| COMP-02 | Generic component accepts any valid item type | Research.md Pattern 2 |
| COMP-03 | Error boundary handles unknown errors | Research.md Pattern 3 |
| COMP-04 | Form callbacks type-safe with Zod | Research.md Pattern 4 |
| COMP-05 | Monaco Editor callbacks properly typed | Research.md Pattern 5 |
| COMP-06 | API response types from contracts | Research.md Pattern 6 |
| COMP-07 | Playwright test globals properly typed | Research.md Pattern 7 |

## Anti-Patterns to Avoid

1. **Over-Genericizing Types**: ≤2 generic params, ≤5 lines type definition
2. **Blind `any` → `unknown` replacement**: Context-specific handling required
3. **Test-only types in production**: Keep test utilities in `src/test/`

## Dependencies

- **Phase 29**: Contract inference provides `AppRouteImplementation` types for API responses
- **Phase 30**: Test infrastructure won't interfere with component work

## Success Criteria

1. Zero `@typescript-eslint/no-explicit-any` violations in `src/components/**/*.tsx`
2. Zero violations in `src/pages/**/*.tsx`
3. Zero violations in `src/hooks/**/*.ts` (non-test)
4. `src/types/components.ts` exists with reusable type utilities
5. All existing tests still pass
6. No new dependencies required
