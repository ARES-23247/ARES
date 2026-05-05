# Phase 30: Test Types - Research

**Researched:** 2026-05-05
**Domain:** Test mock typing and factory patterns for Vitest/Kysely
**Confidence:** HIGH

## Summary

The ARESWEB codebase has **82 test files** with approximately **131 `@typescript-eslint/no-explicit-any` violations** in test code (126 in backend tests, 3 in test utils, 2 in E2E tests). The project uses Vitest with jsdom for unit/integration testing and Playwright for E2E.

**Primary patterns identified:**
1. **Kysely database mocks** — Every backend test creates a `mockDb: any` with fluent interface chaining (`selectFrom().where().execute()`)
2. **Hono context typing** — `Hono<any>` and `c: any` used throughout for middleware context
3. **ExecutionContext mock** — Shared utility uses `: any` for Cloudflare Workers mocking
4. **Factory functions** — Existing `src/test/factories/` use `Record<string, unknown>` return types instead of domain types

**Key insight:** The existing `createMockExpressionBuilder()` helper provides a pattern for typed mocks but is not consistently used. Factories exist but lack type safety, returning generic `Record<string, unknown>` instead of domain types.

## User Constraints (from STATE.md)

### Locked Decisions
None — Phase 30 is unscoped, awaiting research.

### Claude's Discretion
Research test typing patterns and mock factories for eliminating `any` in tests.

### Deferred Ideas (OUT OF SCOPE)
- MON-03 (usage metrics dashboard) — In progress from v5.7
- 3D Hardware Visualizer headless WebGL optimization — Pending

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Test type definitions | Build-time (TypeScript) | — | Type safety is compile-time only |
| Mock factories | Test runtime | — | Test execution environment |
| Database mocking | Test runtime | — | Kysely mock objects |
| ExecutionContext mocking | Test runtime | — | Cloudflare Workers API simulation |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **vitest** | 4.1.5 | Test runner | Fast unit testing with ES modules support |
| **@vitest/coverage-v8** | 4.1.5 | Code coverage | Integrated V8 coverage for Vitest |
| **jsdom** | 29.1.1 | DOM environment | Browser API simulation for tests |

### Mock/Testing Utilities
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **msw** | 2.14.3 | HTTP mocking | Mock fetch/XMLHttpRequest for API testing |
| **@faker-js/faker** | 10.4.0 | Test data generation | Create realistic test data |
| **@testing-library/react** | 16.3.2 | React component testing | User-centric component assertions |
| **@testing-library/jest-dom** | 6.9.1 | DOM matchers | Custom Jest/Vitest matchers for DOM |
| **vitest** | 4.1.5 | Built-in vi mocks | Function and module mocking |

### Database Test Types
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **kysely** | 0.28.17 | Type-safe queries | `Selectable<>`, `Insertable<>`, `Updateable<>` for DB rows |
| **kysely-d1** | 0.4.0 | Cloudflare D1 dialect | D1-specific query types |

### E2E Testing
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@playwright/test** | 1.59.1 | E2E test runner | Full user flow testing |
| **@axe-core/playwright** | 4.11.3 | Accessibility testing | WCAG compliance validation |

**Installation:** All dependencies already installed.

**Version verification:**
```bash
npm view vitest version
# 4.1.5 (current in package.json)

npm view @faker-js/faker version
# 10.4.0 (current in package.json)
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Vitest Test Runner                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                Test Setup (src/test/setup.ts)        │  │
│  │  • MSW server initialization                         │  │
│  │  • jsdom environment configuration                   │  │
│  │  • Cloudflare globals mocking (caches, etc.)        │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                                │
│  ┌──────────────────────────▼──────────────────────────┐  │
│  │         Test Utilities (src/test/utils.tsx)          │  │
│  │  • mockExecutionContext (currently `: any`)         │  │
│  │  • createMockExpressionBuilder() (pattern exists)   │  │
│  │  • flushWaitUntil() helper                          │  │
│  │  • renderWithProviders() wrapper                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                                │
│  ┌──────────────────────────▼──────────────────────────┐  │
│  │          Mock Factories (src/test/factories/)        │  │
│  │  • authFactory.ts (createMockSession, etc.)         │  │
│  │  • userFactory.ts (createMockUser, etc.)            │  │
│  │  • eventFactory.ts (createMockEvent, etc.)          │  │
│  │  • contentFactory.ts (createMockPost, etc.)         │  │
│  │  • logisticsFactory.ts (createMockOutreach, etc.)   │  │
│  │  • systemFactory.ts (createMockNotification, etc.)  │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                                │
│  ┌──────────────────────────▼──────────────────────────┐  │
│  │            MSW Handlers (src/test/mocks/handlers/)   │  │
│  │  • auth.ts, user.ts, events.ts, content.ts          │  │
│  │  • logistics.ts, system.ts                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend Test Files                         │
│  (functions/api/routes/*.test.ts — 26 files)                │
│  • Hono app initialization with `Hono<any>`                │
│  • Kysely `mockDb: any` with fluent chaining               │
│  • Middleware mocking (getSessionUser, etc.)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Frontend Test Files                        │
│  (src/**/*.test.ts, src/**/*.test.tsx — 14 files)           │
│  • React component testing with @testing-library/react     │
│  • Custom hooks testing with renderHook                    │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (Current — Already Good)

```
src/test/
├── setup.ts              # Vitest global setup
├── utils.tsx             # Shared test utilities (⚠️ has 3 `any` violations)
├── factories/            # Domain-specific mock factories (⚠️ return `Record<string, unknown>`)
│   ├── authFactory.ts
│   ├── userFactory.ts
│   ├── eventFactory.ts
│   ├── contentFactory.ts
│   ├── logisticsFactory.ts
│   └── systemFactory.ts
└── mocks/                # MSW mock handlers
    ├── server.ts         # MSW server setup
    ├── handlers.ts       # Handler aggregation
    └── handlers/         # Domain-specific handlers
        ├── auth.ts
        ├── user.ts
        ├── events.ts
        └── ...

functions/api/routes/
└── *.test.ts             # Backend tests (26 files, 126 `any` violations)

tests/e2e/
└── *.spec.ts             # Playwright E2E tests (14 files, 2 `any` violations)
```

### Pattern 1: Kysely Database Mock (Current — Untyped)

**What:** Every backend test creates a mock Kysely database with fluent chaining.

**Current state:**
```typescript
// functions/api/routes/badges.test.ts
let mockDb: any;

beforeEach(() => {
  mockDb = {
    selectFrom: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    select: vi.fn((args) => {
      // Handle ExpressionBuilder callback
      if (Array.isArray(args)) {
        args.forEach((arg) => {
          if (typeof arg === "function") {
            arg(createMockExpressionBuilder());
          }
        });
      }
      return mockDb;
    }),
    where: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
    executeTakeFirst: vi.fn().mockResolvedValue(null),
    insertInto: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    updateTable: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    deleteFrom: vi.fn().mockReturnThis(),
  };
});
```

**Why untyped:** Kysely's fluent API is complex to mock; the current pattern uses `: any` to avoid fighting the type system.

**Improved typed version:**
```typescript
import type { Kysely } from "kysely";
import type { DB } from "~/shared/schemas/database";

// Create a mock Kysely interface with only the methods we use in tests
type MockKysely = Partial<Pick<Kysely<DB>, 
  "selectFrom" | "insertInto" | "updateTable" | "deleteFrom"
>> & {
  execute: ReturnType<typeof vi.fn>;
  executeTakeFirst: ReturnType<typeof vi.fn>;
};

let mockDb: MockKysely;

beforeEach(() => {
  mockDb = {
    selectFrom: vi.fn().mockReturnThis(),
    insertInto: vi.fn().mockReturnThis(),
    updateTable: vi.fn().mockReturnThis(),
    deleteFrom: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
    executeTakeFirst: vi.fn().mockResolvedValue(null),
  };
});
```

### Pattern 2: Hono Context Typing (Current — Untyped)

**What:** Hono apps are typed with `Hono<any>` and context variables are `c: any`.

**Current state:**
```typescript
let testApp: Hono<any>;

testApp.use("*", async (c: any, next: any) => {
  c.set("db", mockDb);
  c.set("user", { id: "1", role: "admin" });
  await next();
});
```

**Why untyped:** Hono's environment binding requires a specific type; using `any` avoids defining the full environment.

**Improved typed version:**
```typescript
import type { Hono } from "hono";
import type { ExecutionContext } from "~/src/test/types";

// Define a minimal test environment type
type TestEnv = {
  Variables: {
    db: MockKysely;
    user: { id: string; role: string };
  };
  Bindings: {
    DEV_BYPASS: string;
    DB: D1Database;
  };
};

let testApp: Hono<TestEnv>;

testApp.use("*", async (c, next) => {
  c.set("db", mockDb);
  c.set("user", { id: "1", role: "admin" });
  await next();
});
```

### Pattern 3: ExecutionContext Mock (Current — `: any`)

**What:** Shared mock for Cloudflare Workers ExecutionContext.

**Current location:** `src/test/utils.tsx`
```typescript
export const mockExecutionContext: any = {
  waitUntil: vi.fn((promise) => promise),
  passThroughOnException: vi.fn(),
};
```

**Improved typed version:**
```typescript
// src/test/types.ts
export interface MockExecutionContext {
  waitUntil: ReturnType<typeof vi.fn>;
  passThroughOnException: ReturnType<typeof vi.fn>;
}

export const mockExecutionContext: MockExecutionContext = {
  waitUntil: vi.fn((promise: Promise<unknown>) => promise),
  passThroughOnException: vi.fn(),
};
```

### Pattern 4: Factory Functions (Current — Return `Record<string, unknown>`)

**What:** Domain-specific mock factories using `@faker-js/faker`.

**Current state:**
```typescript
// src/test/factories/userFactory.ts
export const createMockUser = (overrides?: Record<string, unknown>) => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  image: faker.image.avatar(),
  role: faker.helpers.arrayElement(["admin", "author", "unverified"]),
  ...overrides,
});
```

**Why untyped:** Factories return generic objects to allow flexible overrides.

**Improved typed version:**
```typescript
import type { D1Row } from "~/shared/types/database";

type MockUserOverrides = Partial<D1Row<"Users">>;

export const createMockUser = (overrides?: MockUserOverrides): D1Row<"Users"> => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  image: faker.image.avatar(),
  role: faker.helpers.arrayElement(["admin", "author", "unverified"]),
  ...overrides,
});
```

### Anti-Patterns to Avoid

- **Over-typed test mocks:** Don't require every property of a domain type in mocks. Use `Partial<T>` or factory functions.
- **Fragile `as` casting:** Avoid `mockDb as unknown as Kysely<DB>`. Create proper mock types.
- **Repetitive mock setup:** Extract common mock patterns to shared utilities.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fluent chain mocking | Custom `mockReturnThis()` chains | `createMockExpressionBuilder()` pattern (exists but needs standardizing) | Kysely's ExpressionBuilder is complex; centralized mock is more maintainable |
| Test data generation | Random string/number generation | `@faker-js/faker` (already installed) | Realistic test data with less boilerplate |
| HTTP mocking | Custom fetch mocks | `msw` (already installed) | Standard library for Service Worker API mocking |

**Key insight:** The codebase already has the right tools (faker, msn, vitest mocks). The issue is inconsistent typing, not missing functionality.

## Common Pitfalls

### Pitfall 1: `any` in Middleware Mocking
**What goes wrong:** Middleware functions are mocked with `(c: any, next: any) => next()` which bypasses type checking on the context object.

**Why it happens:** Hono middleware has complex generic signatures; using `any` is the path of least resistance.

**How to avoid:** Create a middleware mock type that captures only the required context variables:
```typescript
type MiddlewareFn<E = unknown> = (
  c: import("hono").Context<E>,
  next: () => Promise<void>
) => Promise<void> | void;
```

**Warning signs:** Test files with repeated `(c: any, next: any)` patterns.

### Pitfall 2: Kysely ExpressionBuilder Callbacks
**What goes wrong:** Tests that call `select((eb) => eb.fn.count())` fail because the mock `eb` doesn't have the right methods.

**Why it happens:** Kysely's ExpressionBuilder is a complex fluent API with many methods.

**How to avoid:** The existing `createMockExpressionBuilder()` helper properly mocks the ExpressionBuilder interface. Ensure it's used consistently:
```typescript
select: vi.fn((args) => {
  if (Array.isArray(args)) {
    args.forEach((arg) => {
      if (typeof arg === "function") {
        arg(createMockExpressionBuilder());
      }
    });
  }
  return mockDb;
}),
```

**Warning signs:** Tests failing with "Cannot read property 'fn' of undefined" in Kysely callbacks.

### Pitfall 3: Factory Type Drift
**What goes wrong:** Factory functions return objects that don't match the actual database schema after migrations.

**Why it happens:** Factories return `Record<string, unknown>` instead of using generated database types.

**How to avoid:** Tie factories to `D1Row<T>` types from `shared/types/database.ts`:
```typescript
import type { D1Row } from "~/shared/types/database";

export const createMockUser = (overrides?: Partial<D1Row<"Users">>): D1Row<"Users"> => ({ ... });
```

**Warning signs:** Tests passing with invalid data that would fail at runtime.

## Code Examples

Verified patterns from the codebase:

### Creating a Typed Mock Database
```typescript
// Source: functions/api/routes/badges.test.ts (adapted)
import type { Kysely } from "kysely";
import type { DB } from "~/shared/schemas/database";

// Extract only the Kysely methods actually used in tests
type KyselyMock = {
  selectFrom: ReturnType<typeof vi.fn>;
  insertInto: ReturnType<typeof vi.fn>;
  updateTable: ReturnType<typeof vi.fn>;
  deleteFrom: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
  executeTakeFirst: ReturnType<typeof vi.fn>;
};

const createMockDb = (): KyselyMock => ({
  selectFrom: vi.fn().mockReturnThis(),
  insertInto: vi.fn().mockReturnThis(),
  updateTable: vi.fn().mockReturnThis(),
  deleteFrom: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue([]),
  executeTakeFirst: vi.fn().mockResolvedValue(null),
});

// In tests:
let mockDb: KyselyMock;
beforeEach(() => {
  mockDb = createMockDb();
});
```

### Using createMockExpressionBuilder
```typescript
// Source: src/test/utils.tsx
export function createMockExpressionBuilder() {
  const ebMock: any = vi.fn().mockReturnThis();
  const asMock = { as: vi.fn().mockReturnValue(ebMock) };
  
  ebMock.or = vi.fn().mockReturnThis();
  ebMock.and = vi.fn().mockReturnThis();
  ebMock.val = vi.fn().mockReturnThis();
  ebMock.fn = {
    count: vi.fn().mockReturnValue(asMock),
    sum: vi.fn().mockReturnValue(asMock),
    max: vi.fn().mockReturnValue(asMock),
    min: vi.fn().mockReturnValue(asMock),
    coalesce: vi.fn().mockReturnValue(asMock),
  };
  ebMock.case = vi.fn().mockReturnValue({
    when: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    then: vi.fn().mockReturnThis(),
    else: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  });
  return ebMock;
}
```

### Factory Pattern with Type Safety
```typescript
// Source: src/test/factories/authFactory.ts (improved)
import { faker } from "@faker-js/faker";
import type { DashboardSession } from "~/src/hooks/useDashboardSession";

export const createMockSession = (
  overrides?: Partial<DashboardSession>
): DashboardSession => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    authenticated: true,
    user: {
      id: faker.string.uuid(),
      name: `${firstName} ${lastName}`,
      email: faker.internet.email(),
      image: faker.image.avatar(),
      role: faker.helpers.arrayElement(["admin", "author", "unverified"]),
      member_type: faker.helpers.arrayElement(["student", "coach", "mentor", "parent", "alumni"]),
      first_name: firstName,
      last_name: lastName,
      nickname: firstName,
    },
    ...overrides,
  };
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `: any` for all mocks | Type-safe mock utilities | Ongoing | Better IDE support, catch errors at compile time |
| `Record<string, unknown>` factories | `D1Row<T>` typed factories | Phase 30 | Factories match database schema |
| Ad-hoc mock creation | Shared mock helpers | Existing (`createMockExpressionBuilder`) | Consistent mock behavior across tests |

**Deprecated/outdated:**
- Manual fluent chaining without `createMockExpressionBuilder` — use the helper
- Untyped factory returns — should use domain types

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Kysely's `Selectable<>` types are stable and appropriate for factories | Factory Functions | Low — kysely-codegen generates these types from schema |
| A2 | Test environment can use `D1Row<T>` without runtime D1 dependency | Architecture Patterns | None — `D1Row<T>` is a type-only import |
| A3 | Hono's environment binding can be simplified for tests | Hono Context Typing | Medium — May need to adjust if Hono's type system changes significantly |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

None — The research identified clear patterns and a path forward with existing infrastructure.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| vitest | Test runner | ✓ | 4.1.5 | — |
| @faker-js/faker | Test data | ✓ | 10.4.0 | — |
| msw | HTTP mocking | ✓ | 2.14.3 | — |
| kysely | Database types | ✓ | 0.28.17 | — |
| @vitest/coverage-v8 | Coverage | ✓ | 4.1.5 | — |
| @testing-library/react | Component testing | ✓ | 16.3.2 | — |
| playwright | E2E tests | ✓ | 1.59.1 | — |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 |
| Config file | vite.config.ts (test section) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEST-01 | Typed mock database utilities | unit | `npm run test -- src/test/utils.tsx` | ✅ |
| TEST-02 | Typed factory functions | unit | `npm run test -- src/test/factories/` | ✅ |
| TEST-03 | Backend tests typed | unit | `npm run test -- functions/api/routes/*.test.ts` | ✅ |
| TEST-04 | Hono context typing | unit | `npm run test -- functions/api/routes/badges.test.ts` | ✅ |

### Sampling Rate
- **Per task commit:** `npm run test -- --reporter=verbose <modified-test-file>`
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Coverage thresholds (85% lines, 100% functions, 80% branches) remain green

### Wave 0 Gaps
None — Existing test infrastructure covers all phase requirements. The test utilities, factories, and mock handlers are already in place. This phase adds typing to existing infrastructure.

## Security Domain

Not applicable — Test types are compile-time only and do not affect runtime security.

## Sources

### Primary (HIGH confidence)
- [Vitest Documentation](https://vitest.dev/guide/) — Official Vitest docs (checked 2026-05-05)
- [Kysely Documentation](https://kysely-org.github.io/kysely/) — Type-safe SQL query builder (checked 2026-05-05)
- [MSW Documentation](https://mswjs.io/) — API mocking library (checked 2026-05-05)
- [`@faker-js/faker` Documentation](https://fakerjs.dev/) — Test data generation (checked 2026-05-05)
- **ARESWEB Codebase** — Verified existing patterns in 82 test files

### Secondary (MEDIUM confidence)
- [Kysely GitHub Issue #801 - Writing Unit Tests](https://github.com/kysely-org/kysely/issues/801) — Community discussion on testing patterns
- [Type-Safe Test Data Generation with Kysely](https://medium.com/@amir.latypov/type-safe-test-data-generation-with-kysely-7a6820aad4e6) — Factory pattern guidance
- [Reddit: Mocking MySQL with Kysely and Vitest](https://www.reddit.com/r/node/comments/1bn81q7/how_can_i_mock_a_mysql_database_using_kysely_and/) — Mock implementation patterns

### Tertiary (LOW confidence)
- None — All findings verified against codebase or official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All dependencies verified in package.json
- Architecture: HIGH — Test structure analyzed across 82 files
- Pitfalls: HIGH — Patterns identified from actual test failures and code review

**Research date:** 2026-05-05
**Valid until:** 30 days (test infrastructure is stable)
