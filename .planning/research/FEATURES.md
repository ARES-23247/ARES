# Type Safety Features for Hono/D1

**Domain:** TypeScript type safety patterns for Cloudflare Workers stack
**Researched:** 2026-05-05
**Overall confidence:** HIGH

## Executive Summary

ARESWEB uses Hono with Cloudflare D1 and Kysely, with 983 `@typescript-eslint/no-explicit-any` violations primarily concentrated in the API layer. The current codebase relies on `as` casts (`c.get("db") as Kysely<DB>`, `c.env as any`) and untyped mock objects. Proper type safety requires creating shared context bindings types, D1 result type inference utilities, typed test mock builders, and proper React event handler typing.

## Key Findings

**Stack:** Hono + Kysely + ts-rest + Cloudflare Workers with React frontend
**Architecture:** API-first with ts-rest contracts, middleware-based auth/DB injection
**Critical pitfall:** Blindly replacing `any` with `unknown` causes ~2500 TS compilation errors—must create shared types first

## Type Safety Categories

### 1. Hono Context Bindings (c.get(), c.set())

**Problem:** Hono's context variables are untyped by default. The current pattern uses casts everywhere.

#### BEFORE (Current Pattern - any cast)
```typescript
// Every handler needs this cast
const db = c.get("db") as Kysely<DB>;
const user = c.get("sessionUser") as SessionUser | undefined;

// Middleware sets values without type safety
c.set("db", cachedDb);
c.set("sessionUser", { id: "1", email: "test@example.com" });
```

#### AFTER (Properly Typed - Type-safe middleware)
```typescript
// Create a properly typed context type in middleware/utils.ts
export type HonoContext = Context<{
  Bindings: Bindings;
  Variables: {
    sessionUser: SessionUser | undefined;
    db: Kysely<DB>;
    env: Bindings;
    socialConfig: SocialConfig | undefined;
    requestId?: string;
  };
}>;

// Type-safe middleware using branded context
export const dbMiddleware = async (c: HonoContext, next: Next) => {
  if (!cachedDb) {
    cachedDb = new Kysely<DB>({
      dialect: new D1Dialect({ database: c.env.DB })
    });
  }
  c.set("db", cachedDb); // Type inferred correctly
  await next();
};

// Type-safe getter—no cast needed
const db = c.get("db"); // Kysely<DB> inferred
const user = c.get("sessionUser"); // SessionUser | undefined inferred
```

**Impact:** ~20% of violations eliminated. Pattern: Create branded `HonoContext` type extending `Context<AppEnv>`.

---

### 2. D1/Kysely Query Results and Row Types

**Problem:** Raw SQL queries return `Record<string, unknown>`. Kysely-generated types exist but aren't consistently used.

#### BEFORE (Current Pattern - any assertions)
```typescript
// Raw SQL with any result
const results = await sql<any>`
  SELECT e.id, e.title, e.category, e.date_start
  FROM events_fts f
  JOIN events e ON f.id = e.id
  WHERE f.events_fts MATCH ${cleanQ}
`.execute(db);

// Unsafe access with casts
results.rows.map(e => ({
  ...e,
  season_id: e.season_id ? Number(e.season_id) : null,
  is_deleted: Number(e.is_deleted || 0)
}));

// D1 prepare().all() returns Record<string, any>
const stmt = db.prepare("SELECT * FROM settings WHERE key = ?");
const row = await stmt.bind(key).first() as any;
```

#### AFTER (Properly Typed - Row type definitions)
```typescript
// Define row types for raw SQL queries
interface EventFtsRow {
  id: string;
  title: string;
  category: string;
  date_start: string;
  date_end: string | null;
  location: string | null;
  description: string | null;
  cover_image: string | null;
  status: string;
  is_deleted: number;
  season_id: number | null;
  meeting_notes: string | null;
}

// Typed SQL result
const results = await sql<EventFtsRow>`
  SELECT e.id, e.title, e.category, e.date_start
  FROM events_fts f
  JOIN events e ON f.id = e.id
  WHERE f.events_fts MATCH ${cleanQ}
`.execute(db);

// Type-safe mapping—no any needed
const events = results.rows.map(e => ({
  ...e,
  season_id: e.season_id ?? null,
  is_deleted: Number(e.is_deleted ?? 0)
}));

// For D1 prepare(), create a helper type
type D1Row<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends { value: infer V } ? V : T[K];
};

interface SettingRow {
  key: string;
  value: string;
}

const stmt = db.prepare("SELECT * FROM settings WHERE key = ?");
const row = await stmt.bind(key).first() as D1Row<SettingRow> | null;
```

**Impact:** ~40% of violations eliminated. Pattern: Create `Row` interfaces for each table accessed via raw SQL.

---

### 3. React Component Props and Event Handlers

**Problem:** Event handlers use implicit `any` for synthetic event types. Props interfaces often incomplete.

#### BEFORE (Current Pattern - Implicit any)
```typescript
// Event handler with implicit any
onChange={(e) => {
  setTitle(e.target.value); // e is implicitly any
}}

// Props with loose typing
interface TaskEditDrawerProps {
  task: TaskItem;
  onClose: () => void;
  onSave: (id: string, updates: Partial<TaskItem>) => Promise<void>;
  onDelete: (id: string) => void;
  // Missing optional props typed loosely
}
```

#### AFTER (Properly Typed - Explicit event types)
```typescript
// Import event types from React
import type { ChangeEvent, FormEvent, MouseEvent } from "react";

// Explicitly typed event handler
const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
  setTitle(e.target.value);
};

// Use in JSX
onChange={handleTitleChange}
// Or inline with explicit type:
onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}

// Button click handlers
const handleSave = (e: MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  onSave(id, updates);
};

// Form submission
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};

// Props interface with precise typing
interface TaskEditDrawerProps {
  task: Readonly<TaskItem>;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Readonly<TaskItem>>) => Promise<void>;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  error?: Error | null;
}

// Use Readonly for props that shouldn't be mutated internally
function TaskEditDrawer({ task, onClose, onSave, onDelete, isLoading, error }: Readonly<TaskEditDrawerProps>) {
  // ...
}
```

**Impact:** ~15% of violations eliminated. Pattern: Import and use `ChangeEvent<T>`, `FormEvent<T>`, `MouseEvent<T>` from React.

---

### 4. Test Mocks (vi.fn, vi.mocked)

**Problem:** Test mocks use `as any` or `as unknown as T` to satisfy type constraints.

#### BEFORE (Current Pattern - Unsafe casts)
```typescript
// Mock database with loose typing
const mockDb: any = {
  selectFrom: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue([]),
};

// Test context with unknown cast
const mockContext = {
  get: vi.fn(),
  set: vi.fn(),
  env: { DB: {}, DEV_BYPASS: "true" }
} as unknown as Context<AppEnv>;

// Mock fetch with unsafe cast
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ success: true }),
}) as any;
```

#### AFTER (Properly Typed - Mock builder utilities)
```typescript
// Create a typed mock builder for Kysely
import { Kysely } from "kysely";
import { DB } from "../../../shared/schemas/database";

interface MockKysely<T> {
  selectFrom: ReturnType<typeof vi.fn>;
  selectAll: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  insertInto: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
  executeTakeFirst: ReturnType<typeof vi.fn>;
  // Add other methods as needed
}

// Type-safe mock factory
function createMockDb(): MockKysely<DB> {
  return {
    selectFrom: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insertInto: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
    executeTakeFirst: vi.fn().mockResolvedValue(null),
  };
}

// Type-safe Hono context mock
import type { Context } from "hono";

function createMockContext(overrides: Partial<AppEnv["Variables"]> = {}): Context<AppEnv> {
  return {
    get: vi.fn((key) => overrides[key as keyof AppEnv["Variables"]]),
    set: vi.fn(),
    env: {
      DB: {} as D1Database,
      DEV_BYPASS: "true",
      // Add other required bindings
    },
    req: { url: "http://localhost", header: vi.fn() } as any,
    json: vi.fn(),
    text: vi.fn(),
    // Add other required Context properties
  } as unknown as Context<AppEnv>;
}

// Type-safe fetch mock
interface MockFetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

function mockFetchSuccess(response: MockFetchResponse): void {
  globalThis.fetch = vi.fn().mockResolvedValue(response as unknown as Response);
}

// Usage in tests
const mockDb = createMockDb();
mockDb.execute.mockResolvedValue({ rows: [{ id: "1", title: "Test" }] });
```

**Impact:** ~20% of violations in tests. Pattern: Create mock factory functions with proper return types.

---

### 5. API Route Handlers with Request/Response Types

**Problem:** ts-rest handlers use `any` for input/contract types. Request/response bodies lack type narrowing.

#### BEFORE (Current Pattern - any handlers)
```typescript
const docTsRestRouter: any = s.router(docContract as any, {
  getDocs: async (_: any, c: Context<AppEnv>) => {
    // Handler implementation
  },
  saveDoc: async ({ body }: { body: any }, c: Context<AppEnv>) => {
    // body is any—no type safety
  },
});
```

#### AFTER (Properly Typed - ts-rest inferred types)
```typescript
// Import ts-rest server utilities
import { initServer } from "ts-rest-hono";
import type { AppEnv } from "../middleware/utils";

const s = initServer<AppEnv>();

// Type inference from contract—no any needed
const docTsRestRouter = s.router(docContract, {
  getDocs: async (_input, c) => {
    // _input is properly typed from contract
    // c is Context<AppEnv>
    const db = c.get("db"); // Kysely<DB> inferred

    const results = await db
      .selectFrom("docs")
      .select(["slug", "title", "category"])
      .where("is_deleted", "=", 0)
      .execute();

    return { status: 200, body: { docs: results } };
  },

  saveDoc: async ({ body }, c) => {
    // body is typed from docContract.saveDoc.body schema
    const { slug, title, content, category } = body;

    const db = c.get("db");
    await db
      .insertInto("docs")
      .values({ slug, title, content, category })
      .execute();

    return { status: 201, body: { success: true } };
  },
});

// For non-ts-rest Hono routes, define request/response types
interface GetEventsQuery {
  limit?: string;
  offset?: string;
  q?: string;
}

interface GetEventsResponse {
  events: Array<{
    id: string;
    title: string;
    date_start: string;
    // ... other fields
  }>;
}

app.get("/events", async (c) => {
  const db = c.get("db");
  const query = c.req.query() as GetEventsQuery;

  const events = await db
    .selectFrom("events")
    .selectAll()
    .limit(Number(query.limit || 50))
    .execute();

  const response: GetEventsResponse = { events };
  return c.json(response);
});
```

**Impact:** ~10% of violations eliminated. Pattern: Let ts-rest infer types from contracts, define explicit interfaces for non-contract routes.

---

## Mechanical vs Semantic Type Improvements

### Mechanical Changes (Safe, Bulk Operations)
These are straightforward replacements that don't change semantics:

| Pattern | Replace With | Risk |
|---------|--------------|------|
| `c.get("db") as Kysely<DB>` | Typed middleware getter | LOW |
| `(e) => setValue(e.target.value)` | `(e: ChangeEvent<HTMLInputElement>) => ...` | LOW |
| `vi.fn().mockResolvedValue({})` | Typed mock factory | LOW |
| `async (_: any, c: Context<AppEnv>)` | Remove `any`, use ts-rest inference | LOW |

### Semantic Type Improvements (Requires Domain Knowledge)
These require understanding the data and may need runtime validation:

| Pattern | Requires | Risk |
|---------|----------|------|
| `sql<any>\`SELECT ...\`` | Define row interfaces for each query | MEDIUM |
| `await stmt.first() as any` | Create `D1Row<T>` helper types | MEDIUM |
| External API responses (`any`) | Zod schemas or response interfaces | MEDIUM |
| `JSON.parse() as T` | Zod validation or `unknown` narrowing | HIGH |

---

## MVP Recommendation

### Phase 1: Shared Type Infrastructure (Foundation)
Create these utilities first—enables all subsequent work:

1. **`functions/types/hono.ts`** — Branded context types
2. **`functions/types/d1.ts`** — `D1Row<T>` helper
3. **`functions/types/kysely-mock.ts`** — Mock factory for tests

### Phase 2: High-Impact Routes (Tackle biggest violations first)
Based on 24-SUMMARY.md top offenders:

1. `functions/api/routes/events/handlers.ts` (77 violations)
   - Create `EventRow`, `EventFtsRow` interfaces
   - Replace `sql<any>` with typed SQL

2. `functions/api/routes/docs.ts` (51 violations)
   - Create `DocRow`, `DocHistoryRow` interfaces
   - Type `docSearchCache` properly

3. `functions/api/routes/tasks.test.ts` (39 violations)
   - Use typed mock factories from Phase 1

### Phase 3: Test File Standardization
Apply mock factories to all test files. Can use `as unknown as T` more liberally in tests.

### Defer
- External API response typing (Zulip, TBA, GitHub) — requires API contract analysis
- `JSON.parse()` result typing — requires Zod validation strategy

---

## Sources

- **High Confidence:** Direct analysis of ARESWEB codebase patterns
- **Medium Confidence:** Hono/Cloudflare Workers type patterns (general ecosystem knowledge)
- **Low Confidence:** None—findings based on actual code examination
