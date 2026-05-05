# Phase 30: Test Types - Context

**Phase:** 30 - Test Types
**Status:** Planning
**Date:** 2026-05-05

## User Vision

Eliminate all `@typescript-eslint/no-explicit-any` violations in 82 test files by creating typed mock utilities and migrating factories to use domain types from Phase 29.

## Decisions from /gsd-discuss-phase

### Locked Decisions

**D-01: Use MockKysely interface pattern**
- Create `MockKysely<T>` type in `src/test/types.ts` for database mocks
- Extract only Kysely methods actually used in tests (selectFrom, insertInto, updateTable, deleteFrom, execute, executeTakeFirst)
- Use vi.fn().mockReturnThis() for fluent chaining

**D-02: Create TestEnv for Hono context typing**
- Define `TestEnv` type in `src/test/types.ts` for Hono environment binding
- Include Variables (db, user) and Bindings (DEV_BYPASS, DB)
- Use `Hono<TestEnv>` instead of `Hono<any>` in all backend tests

**D-03: Tie factories to D1Row<T> types**
- Factory return types should use `D1Row<T>` from `shared/types/database.ts`
- Override parameter type: `Partial<D1Row<T>>`
- Existing authFactory.ts pattern (DashboardSession) is the reference

**D-04: ExecutionContext mock gets dedicated type**
- Export `MockExecutionContext` interface from `src/test/types.ts`
- Move mockExecutionContext from utils.tsx to use the new type
- Remove eslint-disable for this specific mock

### Claude's Discretion

- Split backend test migrations into 2-3 waves by domain (auth/core, content/logistics, admin/operations)
- E2E test violations (2 total) can be batch fixed in one plan
- Frontend component tests (if any) grouped by test pattern

### Deferred Ideas (OUT OF SCOPE)

- None deferred — all test typing work is in scope

## Research Summary

From 30-RESEARCH.md:

- **131 `any` violations** across 82 test files
- **126 violations** in 26 backend test files (`functions/api/routes/*.test.ts`)
- **3 violations** in `src/test/utils.tsx` (mockExecutionContext, createMockExpressionBuilder, flushWaitUntil)
- **2 violations** in 14 E2E test files

### Primary Untyped Patterns

1. **`let mockDb: any`** — Kysely database mocks with fluent chaining
2. **`Hono<any>` and `c: any`** — Hono context typing in middleware
3. **`mockExecutionContext: any`** — Cloudflare Workers mock
4. **Factories return `Record<string, unknown>`** — Instead of domain types

### Existing Infrastructure

- `src/test/factories/` (6 factory files: auth, user, event, content, logistics, system)
- `src/test/mocks/handlers/` (MSW handlers)
- `createMockExpressionBuilder()` helper (already typed-ish but using `any`)
- `flushWaitUntil()` helper for async background tasks

### Path Forward

1. Create `src/test/types.ts` with shared test types
2. Migrate factories to use `D1Row<T>` return types
3. Batch-migrate backend tests by domain
4. Fix utils.tsx violations
5. Fix E2E test violations

## Dependencies

- **Phase 29 (Complete):** Provides `D1Row<T>`, `AppEnv`, `HonoContext` types
- **Phase 27 (Complete):** Provides shared type infrastructure

## Anti-Patterns (from REQUIREMENTS.md)

### Anti-Pattern 3: Over-Typed Test Mocks

**DON'T:**
```typescript
const mockSponsor: Sponsor = {
  id: 1,
  name: 'Test',
  logo_url: 'test.png',
  level: 'gold',
  // ... 20 more required fields
};
```

**DO:**
```typescript
const mockSponsor = { id: 1, name: 'Test' } as Partial<Sponsor>;

// OR: Use factory function
const createMockSponsor = (overrides?: Partial<Sponsor>): Sponsor => ({
  id: 1,
  name: 'Test Sponsor',
  logo_url: '',
  level: 'bronze',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});
```

**Rule:** Test mocks must use `Partial<T>` or factory functions. Mock objects should not exceed 10 properties.

## Success Criteria

1. All 131 test `any` violations eliminated
2. `src/test/types.ts` exists with `MockKysely`, `TestEnv`, `MockExecutionContext`
3. All 6 factory files return typed domain types (`D1Row<T>` or domain interfaces)
4. Backend tests use `Hono<TestEnv>` and `MockKysely`
5. `src/test/utils.tsx` has zero `any` violations
6. E2E tests have zero `any` violations
7. All tests still pass after migration

## Acceptance Tests

- `npm run test` passes without errors
- `npm run test -- functions/api/routes/*.test.ts` passes for each domain wave
- `npm run test -- src/test/utils.tsx` passes
- `npm run test:e2e` passes (if E2E tests affected)
- `grep -c "as any\|: any\|<any>" src/test/types.ts` returns 0
- `grep -c ": any" functions/api/routes/*.test.ts` returns 0
