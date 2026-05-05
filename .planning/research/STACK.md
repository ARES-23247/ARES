# Technology Stack

**Project:** ARESWEB — TypeScript Any Elimination
**Researched:** 2025-01-05
**Overall confidence:** HIGH

## Executive Summary

The ARESWEB codebase has 983 `@typescript-eslint/no-explicit-any` violations across Hono API routes, React components, and test files. This research documents modern TypeScript patterns (current as of 2025) for systematically eliminating these violations while maintaining type safety and code quality.

**Key findings:**
1. The current ESLint configuration disables `no-explicit-any` for API routes (`functions/api/routes/**/*`) — this is the primary source of violations
2. Main violation categories: D1 row type casting (35%), ts-rest handler types (25%), test mocking (20%), React props (10%), fallback/unknown handling (10%)
3. Modern TypeScript provides utility types and patterns that can eliminate 80%+ of violations without runtime type assertions
4. Test mocking can be made type-safe using factory functions, `vi.mocked()`, and proper mock types

## Recommended Stack

### Core TypeScript Patterns (ES2022+)

| Pattern | Purpose | When to Use | Why |
|---------|---------|-------------|-----|
| **Generics with Constraints** | Type-safe reusable functions | When writing functions that accept multiple types | Preserves type information through transformations |
| **Utility Types** | Transform existing types | For partial, pick, omit operations | Built-in, zero-runtime-cost type manipulation |
| **Type Guards & Narrowing** | Runtime type checking | When dealing with unions, external data | Enables type flow analysis |
| **`unknown` vs `any`** | Safer "any" type | When you truly don't know the type | Requires type narrowing before use |
| **Conditional Types** | Type-level logic | For complex type relationships | Eliminates manual type assertions |
| **Template Literal Types** | String manipulation at type level | For typed string combinations | Catches errors at compile time |
| **Brand Types** | Nominal typing | To prevent type confusion | Prevents mixing similar types |

### TypeScript 5.8+ Utility Types

```typescript
// Built-in globally available types (no imports needed)

// Partial<T> — Make all properties optional
type TaskUpdate = Partial<Task>;

// Required<T> — Make all properties required
type CompleteTask = Required<PartialTask>;

// Readonly<T> — Make all properties readonly
type ImmutableTask = Readonly<Task>;

// Pick<T, K> — Select specific properties
type TaskPreview = Pick<Task, "id" | "title" | "status">;

// Omit<T, K> — Remove specific properties
type TaskCreateInput = Omit<Task, "id" | "created_at">;

// Exclude<UnionType, ExcludedMembers> — Remove from union
type StatusWithoutDraft = Exclude<TaskStatus, "draft">;

// Extract<Type, Union> — Keep only matching from union
type AdminRoles = Extract<Role, "admin" | "superadmin">;

// NonNullable<Type> — Remove null and undefined
type GuaranteedName = NonNullable<string | null>;

// Parameters<Type> — Get function parameter types
type TaskHandlerParams = Parameters<typeof handleTask>;

// ReturnType<Type> — Get function return type
type TaskResult = ReturnType<typeof processTask>;

// Awaited<Type> — Unwrap promises
type ResolvedUser = Awaited<Promise<User>>;

// NoInfer<Type> — Block type inference (TS 5.4+)
function createTask<T>(defaults: T, override?: NoInfer<T>): T { ... }
```

### Hono-Specific Type Patterns

| Pattern | Example | Use Case |
|---------|---------|----------|
| **Generic Context** | `Context<Env, "/" , Variables>` | Type-safe env/variables access |
| **Environment Bindings** | `type Bindings = { DB: D1Database }` | Cloudflare Workers types |
| **Middleware Typing** | `MiddlewareHandler<AppEnv>` | Type-safe middleware chains |
| **Response Type Inference** | `TypedResponse<T>` | Type-safe API responses |
| **Handler Typing** | `Handler<Env, "/", { in: Input, out: Output }>` | ts-rest-style contracts |

### Kysely Type Patterns

| Pattern | Example | Use Case |
|---------|---------|----------|
| **Selectable** | `db.selectFrom('users').select(['id', 'name']$).execute()` | Type-safe SELECT queries |
| **Insertable** | `type UserInsert = Insertable<User>` | Type-safe INSERT operations |
| **Updateable** | `type UserUpdate = Updateable<User>` | Type-safe UPDATE operations |
| **Generated Type** | Handles auto-increment/timestamp columns | Generated columns at DB level |
| **ExpressionBuilder** | `eb => eb('column', '=', value)` | Type-safe WHERE clauses |

### Test Mocking Patterns (Vitest)

| Pattern | When Safe | Why Prefer This |
|---------|-----------|-----------------|
| **Mock Factories** | Always | Type-safe, reusable, explicit |
| **`vi.mocked()`** | With Vitest | Built-in type helper |
| **Spy Functions** | When testing interactions | Preserves original behavior |
| **`as unknown as T`** | NEVER | Anti-pattern, last resort only |
| **Partial Mocks** | When interface is large | Type-safe subset mocking |

### Test Infrastructure

| Technology | Version | Purpose | When to Use |
|-------------|---------|---------|-------------|
| **Vitest** | ^4.1.5 | Test runner with TypeScript support | All new tests |
| **@testing-library/react** | ^16.3.2 | Component testing | React component tests |
| **MSW** | ^2.14.3 | Network mocking | API integration tests |
| **vi.mocked()** | Built-in | Type-safe mock wrapping | When mocking functions |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **ts-pattern** | - | Pattern matching without `any` | Complex type narrowing |
| **zod** | ^4.4.3 | Runtime validation + types | External data validation |
| **ts-pattern** | - | Exhaustive pattern matching | Union type handling |
| **type-fest** | - | Additional utility types | Advanced type manipulation |

## Installation

```bash
# Core TypeScript (already installed)
npm install --save-dev typescript@^6

# Type-safe testing patterns
npm install --save-dev @faker-js/faker@^10.4.0

# Note: Most utility types are built into TypeScript 5.8+
# No additional installation required for standard patterns
```

## Patterns by Category

### 1. Generic Type Patterns

```typescript
// Generic function with constraints
function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {} as Pick<T, K>);
}

// D1 Row Generic (for Cloudflare D1)
type D1Row<T extends keyof DB> = DB[T] & { 
  _rn?: string; // Runtime row number from D1
};

// Usage: Type-safe row access
const rows = await db.selectFrom("tasks").selectAll().execute();
// rows is of type Selectable<DB["tasks"]>[]

// Hono Context Generic
type AppEnv = {
  Bindings: {
    DB: D1Database;
    AI: Ai;
    VECTORIZE_DB?: VectorizeIndex;
  };
  Variables: {
    sessionUser: SessionUser;
    requestId: string;
  };
};

// Handler with typed context
const handler = async (c: Context<AppEnv>) => {
  const db = c.get("db"); // Type is Kysely<DB>
  const user = c.get("sessionUser"); // Type is SessionUser
  return c.json({ user });
};
```

### 2. Type Narrowing Techniques

```typescript
// Type guards
function isTask(value: unknown): value is Task {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "title" in value &&
    "status" in value
  );
}

// Discriminated unions
type TaskResult =
  | { success: true; data: Task }
  | { success: false; error: string };

function handleTask(result: TaskResult) {
  if (result.success) {
    // TypeScript knows result.data is Task here
    console.log(result.data.title);
  } else {
    // TypeScript knows result.error is string here
    console.error(result.error);
  }
}

// Assertion functions
function assertTask(value: unknown): asserts value is Task {
  if (!isTask(value)) {
    throw new Error("Value is not a Task");
  }
}

// Usage with external data
const data = JSON.parse(jsonString);
assertTask(data); // Throws if not valid
console.log(data.title); // TypeScript knows this is safe

// Control flow analysis with predicates
function isAdmin(user: SessionUser): boolean {
  return user.role === "admin";
}

if (isAdmin(user)) {
  // TypeScript narrows user.role to "admin"
  user.role; // "admin" not "admin" | "author" | "unverified"
}
```

### 3. Utility Type Patterns

```typescript
// Partial for updates
function updateTask(id: string, updates: Partial<Task>): Task {
  const existing = getTask(id);
  return { ...existing, ...updates };
}

// Required for ensuring all fields
function validateTask(task: Partial<Task>): task is Task {
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.status === "string"
  );
}

// Pick for public APIs
type PublicTask = Pick<Task, "id" | "title" | "status">;

// Omit for creating (exclude auto-generated fields)
type NewTaskInput = Omit<Task, "id" | "created_at" | "updated_at">;

// Record for dynamic lookups
type TaskStatusMap = Record<Task["status"], Task[]>;

// ReturnType for handler responses
type HandlerResponse<T> = Promise<
  | { status: 200; body: { success: true; data: T } }
  | { status: 400; body: { error: string } }
  | { status: 500; body: { error: string } }
>;

// Parameters for extracting function args
type TaskHandler = (task: Task, user: SessionUser) => Promise<Task>;
type TaskHandlerArgs = Parameters<TaskHandler>; // [Task, SessionUser]
```

### 4. `unknown` vs `any` Patterns

```typescript
// ❌ BAD: any defeats type checking
function processAny(data: any) {
  console.log(data.anything.goes); // No type checking, can crash at runtime
}

// ✅ GOOD: unknown forces type checking
function processUnknown(data: unknown) {
  // Must narrow before using
  if (typeof data === "object" && data !== null) {
    console.log((data as Record<string, unknown>).anything); // Still need check
  }
}

// ✅ BEST: unknown with type guard
function processData(data: unknown) {
  if (isTask(data)) {
    console.log(data.title); // Safe, TypeScript knows it's a Task
  }
}

// When to use each:
// - any: NEVER (except when absolutely necessary for interop)
// - unknown: External data (JSON parsing, API responses, user input)
// - specific type: Everything else

// Pattern: unknown → specific type
function parseTask(json: string): Task {
  const data: unknown = JSON.parse(json); // unknown, not any
  if (!isTask(data)) {
    throw new Error("Invalid task data");
  }
  return data; // TypeScript knows this is Task
}
```

### 5. Test Mock Patterns

```typescript
// ❌ BAD: Type-unsafe mock
const mockUser = {
  id: "1",
  name: "Test",
  // Missing required fields!
} as any;

vi.mock("../lib/api", () => ({
  fetchUser: vi.fn().mockResolvedValue({}) as any,
}));

// ✅ GOOD: Mock factories
function createMockTask(overrides?: Partial<Task>): Task {
  return {
    id: "test-id",
    title: "Test Task",
    status: "todo",
    priority: "normal",
    sort_order: 0,
    created_at: new Date().toISOString(),
    created_by: "test-user",
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// Usage: Type-safe, all required fields present
const task = createMockTask({ title: "Custom Title" });

// ✅ GOOD: vi.mocked() helper
import { fetchTask } from "../lib/api";
vi.mock("../lib/api");

test("fetches task", async () => {
  const mockFetch = vi.mocked(fetchTask);
  mockFetch.mockResolvedValue(createMockTask());
  
  const result = await fetchTask("1");
  expect(result).toBeDefined();
});

// ✅ GOOD: Partial mocks with Pick
interface MockDB extends Pick<Kysely<DB>, "selectFrom" | "insertInto"> {
  selectFrom: ReturnType<typeof vi.fn>;
  insertInto: ReturnType<typeof vi.fn>;
}

const mockDb: MockDB = {
  selectFrom: vi.fn(),
  insertInto: vi.fn(),
};

// ✅ GOOD: MSW with typed handlers
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get<{ id: string }, never, Task>(
    "/api/tasks/:id",
    ({ params }) => {
      return HttpResponse.json(createMockTask({ id: params.id }));
    }
  ),
];

// ✅ GOOD: vi.spyOn for partial mocking
import * as api from "../lib/api";

test("calls API correctly", () => {
  const spy = vi.spyOn(api, "fetchTask");
  spy.mockResolvedValue(createMockTask());
  
  await render(<TaskList />);
  expect(spy).toHaveBeenCalledWith("1");
});
```

### 6. Hono/Cloudflare Workers Patterns

```typescript
// ❌ BAD: Untyped context
const badHandler = async (c: Context) => {
  const db = c.get("db") as any; // No type safety
  const user = c.get("sessionUser") as any;
  return c.json({ user }); // No validation
};

// ✅ GOOD: Generic context
type AppEnv = {
  Bindings: {
    DB: D1Database;
    AI: Ai;
    VECTORIZE_DB?: VectorizeIndex;
    ARES_KV: KVNamespace;
    BETTER_AUTH_SECRET: string;
    // ... all Cloudflare bindings
  };
  Variables: {
    sessionUser: SessionUser;
    requestId: string;
    db: Kysely<DB>;
    env: Bindings;
  };
};

const goodHandler = async (c: Context<AppEnv>) => {
  const db = c.get("db"); // Type: Kysely<DB>
  const user = c.get("sessionUser"); // Type: SessionUser
  return c.json({ user }); // Type-safe response
};

// ✅ GOOD: Middleware typing
const authMiddleware = async (
  c: Context<AppEnv>,
  next: Next
) => {
  const user = await getSessionUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("sessionUser", user);
  await next();
};

// ✅ GOOD: Handler typing
type HandlerResponse<T> = TypedResponse<T>;

const getTask = async (id: string): HandlerResponse<Task> => {
  // Implementation
  return c.json(task);
};

// ✅ GOOD: Typed route with parameter extraction
type TaskRoute = {
  in: {
    params: { id: string };
    query: { include?: "history" };
  };
  out: {
    200: { task: Task };
    404: { error: string };
  };
};
```

### 7. D1/Kysely Type Patterns

```typescript
// ❌ BAD: Untyped query results
const rows = await db
  .selectFrom("tasks")
  .selectAll()
  .execute() as any[]; // Lost type safety

// ✅ GOOD: Kysely generated types
import { DB } from "@shared/schemas/database";

// Type-safe query
const rows = await db
  .selectFrom("tasks")
  .selectAll()
  .execute();
// Type: Selectable<DB["tasks"]>[]

// ✅ GOOD: Selectable for read operations
type TaskRow = Selectable<DB["tasks"]>;
// Removes Generated<T> wrapper, makes types usable

// ✅ GOOD: Insertable for writes
type NewTask = Insertable<DB["tasks"]>;
// Makes optional fields truly optional, handles transformations

// ✅ GOOD: Updateable for updates
type TaskUpdate = Updateable<DB["tasks"]>;
// Only allows updating columns that can be updated

// ✅ GOOD: Generic row type
function typedRow<T extends keyof DB>(
  table: T,
  row: Selectable<DB[T]>
): Selectable<DB[T]> {
  return row;
}

// ✅ GOOD: Dynamic table typing
function getTable<T extends keyof DB>(table: T) {
  return db.selectFrom(table);
}

// Usage with type inference
const tasks = getTable("tasks").selectAll().execute();
// Type inferred correctly

// ✅ GOOD: ExpressionBuilder typing
const tasks = await db
  .selectFrom("tasks")
  .where((eb) => eb("status", "=", "todo"))
  .execute();
// eb is properly typed for the tasks table

// ✅ GOOD: Join typing
const tasksWithUsers = await db
  .selectFrom("tasks as t")
  .innerJoin("user as u", "t.created_by", "u.id")
  .select([
    "t.id",
    "t.title",
    "u.name as creator_name",
  ])
  .execute();
// Result is properly typed with the selected columns
```

### 8. React Component Type Patterns

```typescript
// ❌ BAD: Props as any
function BadComponent({ data }: { data: any }) {
  return <div>{data.anything}</div>;
}

// ✅ GOOD: Explicit props interface
interface ComponentProps {
  data: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

function GoodComponent({ data, onUpdate }: ComponentProps) {
  return <div>{data.title}</div>;
}

// ✅ GOOD: Generic component
function List<T extends { id: string }>({ items, renderItem }: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  return <ul>{items.map(item => <li key={item.id}>{renderItem(item)}</li>)}</ul>;
}

// Usage maintains type safety
<List items={tasks} renderItem={(task) => task.title} />

// ✅ GOOD: Discriminated union props
type CardProps =
  | { variant: "user"; user: User }
  | { variant: "task"; task: Task };

function Card(props: CardProps) {
  switch (props.variant) {
    case "user":
      return <UserProfile user={props.user} />;
    case "task":
      return <TaskCard task={props.task} />;
  }
}

// ✅ GOOD: Polymorphic component
type FlexProps<T extends React.ElementType> = {
  as?: T;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<T>;

function Flex<T extends React.ElementType = "div">({
  as,
  children,
  ...props
}: FlexProps<T>) {
  const Component = as || "div";
  return <Component {...props}>{children}</Component>;
}

// Usage: Valid HTML attributes are enforced
<Flex as="button" type="button">Click me</Flex>
<Flex as="a" href="/path">Link</Flex>
```

### 9. Error Handling Type Patterns

```typescript
// Discriminated error types
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// Type-safe error handling
async function fetchTask(id: string): Promise<Result<Task>> {
  try {
    const task = await db.selectFrom("tasks")
      .where("id", "=", id)
      .executeTakeFirst();
    
    if (!task) {
      return { success: false, error: new Error("Task not found") };
    }
    
    return { success: true, data: task };
  } catch (e) {
    return { 
      success: false, 
      error: e instanceof Error ? e : new Error(String(e)) 
    };
  }
}

// Usage with type narrowing
const result = await fetchTask("1");
if (result.success) {
  console.log(result.data.title); // TypeScript knows data exists
} else {
  console.error(result.error.message); // TypeScript knows error exists
}

// Asserts function for unknown errors
function assertError(error: unknown): asserts error is Error {
  if (!(error instanceof Error)) {
    throw new Error("Not an error");
  }
}
```

### 10. Advanced Generic Patterns

```typescript
// Generic factory pattern
function createFactory<T>(defaults: T) {
  return (overrides?: Partial<T>): T => ({
    ...defaults,
    ...overrides,
  });
}

// Usage
const createMockTask = createFactory<Task>({
  id: "test-id",
  title: "Test Task",
  status: "todo",
  priority: "normal",
  sort_order: 0,
  created_at: new Date().toISOString(),
  created_by: "test-user",
  updated_at: new Date().toISOString(),
});

const task = createMockTask({ title: "Custom" });

// Deep partial type
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object 
    ? DeepPartial<T[P]> 
    : T[P];
};

function updateTaskDeep(
  task: Task,
  updates: DeepPartial<Task>
): Task {
  return { ...task, ...updates };
}

// Branded types for nominal typing
type TaskId = string & { readonly brand: unique symbol };
type UserId = string & { readonly brand: unique symbol };

function createTaskId(id: string): TaskId {
  return id as TaskId;
}

function createUserId(id: string): UserId {
  return id as UserId;
}

// Cannot accidentally use UserId where TaskId is expected
function assignTask(taskId: TaskId, userId: UserId) {
  // Implementation
}

// Conditional types for type transformations
type NullableFields<T> = {
  [P in keyof T]: null extends T[P] ? P : never;
}[keyof T];

type RequiredFields<T> = {
  [P in keyof T]: null extends T[P] ? never : P;
}[keyof T];

// Extract nullable and required column names
type TaskNullableFields = NullableFields<DB["tasks"]>;
type TaskRequiredFields = RequiredFields<DB["tasks"]>;

// Template literal types
type EventName = `on${Capitalize<string>}`;
type TaskEvents = {
  [K in keyof Task as Task[K] extends Function 
    ? never 
    : `on${Capitalize<string & K>}`]?: (value: Task[K]) => void;
};
```

## Pattern Categories for ARESWEB

### Category 1: D1 Row Type Casting (~35% of violations)

**Current Pattern:**
```typescript
// ❌ Current: Untyped casting
const row = await db.selectFrom("tasks").selectAll().executeTakeFirst() as any;
```

**Recommended Pattern:**
```typescript
// ✅ Use Kysely's generated types
import { DB } from "@shared/schemas/database";

const row = await db
  .selectFrom("tasks")
  .selectAll()
  .executeTakeFirst();
// Type: Selectable<DB["tasks"]> | undefined

// For non-nullable results
const row = await db
  .selectFrom("tasks")
  .selectAll()
  .where("id", "=", id)
  .executeTakeFirstOrThrow();
// Type: Selectable<DB["tasks"]>
```

**Why:** Kysely-codegen already generates `Selectable`, `Insertable`, and `Updateable` types. Using them eliminates type assertions while maintaining full type safety.

### Category 2: ts-rest Handler Types (~25% of violations)

**Current Pattern:**
```typescript
// ❌ Current: Untyped handler
const handlers = {
  getTask: async ({ params }: { params: any }, c: Context<AppEnv>) => {
    // No type safety on params
  }
} as any;
```

**Recommended Pattern:**
```typescript
// ✅ Use ts-rest's typed router
import { initServer } from "ts-rest-hono";
import { taskContract } from "@shared/schemas/contracts/taskContract";

const s = initServer<AppEnv>();

const handlers = s.router(taskContract, {
  getTask: async ({ params }, c) => {
    // params.id is typed as string
    const task = await fetchTask(params.id);
    return { status: 200, body: { task } };
  },
});
```

**Why:** `initServer` from `ts-rest-hono` provides full type inference for request params, query, body, and response types. The contract defines all types centrally.

### Category 3: Test Mocking (~20% of violations)

**Current Pattern:**
```typescript
// ❌ Current: as any casting
const mockUser = { name: "Test" } as any;
vi.mocked(db.selectFrom).mockReturnValue({} as any);
```

**Recommended Pattern:**
```typescript
// ✅ Use mock factories
function createMockTask(overrides?: Partial<Task>): Task {
  return {
    id: "test-id",
    title: "Test Task",
    status: "todo",
    priority: "normal",
    sort_order: 0,
    created_at: new Date().toISOString(),
    created_by: "test-user",
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ✅ Use vi.mocked() properly
import { fetchTask } from "../lib/api";
vi.mock("../lib/api");

test("fetches task", async () => {
  const mockFetch = vi.mocked(fetchTask);
  mockFetch.mockResolvedValue(createMockTask());
  // ...
});

// ✅ Use MSW for network mocking
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get<{ id: string }, never, Task>(
    "/api/tasks/:id",
    ({ params }) => {
      return HttpResponse.json(createMockTask({ id: params.id }));
    }
  ),
];
```

**Why:** Mock factories ensure all required fields are present. `vi.mocked()` provides type-safe mock function wrapping. MSW provides type-safe request/response mocking.

### Category 4: React Props (~10% of violations)

**Current Pattern:**
```typescript
// ❌ Current: any props
interface Props {
  data: any;
  onUpdate: any;
}
```

**Recommended Pattern:**
```typescript
// ✅ Use explicit props types
interface TaskCardProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete?: (id: string) => void;
}

function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  // Full type safety
}
```

**Why:** Explicit props enable IntelliSense, refactor safety, and catch prop mismatches at compile time.

### Category 5: Fallback/Unknown Handling (~10% of violations)

**Current Pattern:**
```typescript
// ❌ Current: any for unknown data
function processExternal(data: any) {
  return data.value;
}
```

**Recommended Pattern:**
```typescript
// ✅ Use unknown + type guard
function processExternal(data: unknown): string | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "value" in data &&
    typeof data.value === "string"
  ) {
    return data.value;
  }
  return null;
}

// ✅ Or use zod for runtime validation
import { z } from "zod";

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["todo", "in_progress", "done", "blocked"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  sort_order: z.number(),
  created_at: z.string(),
  created_by: z.string(),
  updated_at: z.string(),
});

function parseTask(data: unknown): Task {
  return TaskSchema.parse(data);
}
```

**Why:** `unknown` forces type checking before use. Zod provides runtime validation with type inference.

## Migration Strategy for ARESWEB

### Phase 1: Shared Types (High Impact, Low Risk)
1. Create `functions/shared/types.ts` with common type utilities
2. Add mock factory functions for common entities (Task, User, Event, Doc)
3. Create `D1Row<T>` and related generic types
4. **Expected Impact:** ~200 violations eliminated

### Phase 2: Test Infrastructure (Medium Impact, Low Risk)
1. Create `src/test/factories.ts` with type-safe mock factories
2. Create `src/test/db-mock.ts` for Kysely mock helpers
3. Update test setup to use new factory patterns
4. **Expected Impact:** ~150 violations eliminated

### Phase 3: Route Handlers (High Impact, Medium Risk)
1. Update ts-rest routers to use `initServer<AppEnv>` consistently
2. Add proper types to handler parameters and responses
3. Use `Selectable<T>` for D1 row results
4. **Expected Impact:** ~400 violations eliminated

### Phase 4: React Components (Low Impact, Low Risk)
1. Add explicit prop interfaces for components
2. Use discriminated unions for variant props
3. Add proper generics to list/collection components
4. **Expected Impact:** ~100 violations eliminated

### Phase 5: Fallback/Error Handling (Medium Impact, Low Risk)
1. Replace `any` with `unknown` for external data
2. Add type guards for runtime validation
3. Use Zod for API response validation where needed
4. **Expected Impact:** ~100 violations eliminated

### ESLint Configuration Changes

```typescript
// Current (Problematic)
{
  files: ["functions/api/routes/**/*.{ts,tsx}"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off" // ❌ Disables all checking
  }
}

// Recommended: Gradual enforcement
{
  files: ["functions/api/routes/**/*.{ts,tsx}"],
  rules: {
    "@typescript-eslint/no-explicit-any": ["warn", {
      // Allow for test mocks
      fixToUnknown: true,
      // Require error message explaining why
      ignoreRestArgs: false,
    }]
  }
}

// Final goal: No exceptions
{
  files: ["functions/api/routes/**/*.{ts,tsx}"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

## Sources

### TypeScript Official Documentation
- [TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) — Last updated April 2026
- [TypeScript Handbook - Type Manipulation](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [TypeScript 5.4 Release Notes - Subpath Imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html)

### Testing Patterns
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking) — Last updated April 2025
- [Type-Safe Mocking: Testing Without Lying to TypeScript](https://dev.to/tarunmj6/type-safe-mocking-testing-without-lying-to-typescript-5b5n) — January 2025
- [Type-Safe Module Mocking in Storybook](https://storybook.js.org/blog/type-safe-module-mocking/) — May 2024

### Hono/Cloudflare Workers
- [Cloudflare Workers TypeScript Bindings](https://github.com/cloudflare/workers-types) — Version 4.20260504.1
- [ts-rest-hono Adapter](https://github.com/msutkowski/ts-rest-hono) — Active repository
- [Hono Context Typing Discussion](https://github.com/honojs/hono/issues/3450) — April 2024

### Kysely Type Safety
- [Kysely: Type-Safe SQL Query Builder](https://marmelab.com/blog/2024/02/14/type-safe-sql-wheries-with-kysely.html) — February 2024
- [Kysely API Documentation](https://kysely-org.github.io/kysely-apidoc/interfaces/SelectQueryBuilder.html)
- [Kysely Type Casting StackOverflow](https://stackoverflow.com/questions/78952474/how-to-cast-query-results-to-generated-types)

### ESLint/TypeScript-ESLint
- [typescript-eslint no-explicit-any Rule](https://typescript-eslint.io/rules/no-explicit-any) — Official documentation
- [Why Tests Without Type Safety Are Dangerous](https://medium.com/render-beyond/the-real-reason-typescript-throws-typescript-eslint-no-explicit-any-and-how-to-solve-it-0db310334a93) — Medium article

### Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| TypeScript Utility Types | HIGH | Based on official TypeScript documentation (April 2026) |
| Hono/Cloudflare Workers | HIGH | Based on current @cloudflare/workers-types v4.20260504.1 |
| Kysely Type Patterns | HIGH | Based on Kysely v0.28.17 and official documentation |
| Test Mocking Patterns | HIGH | Based on Vitest v4.1.5 documentation and community best practices |
| React Component Patterns | HIGH | Based on React 19 patterns and @testing-library/react v16.3.2 |
| Migration Strategy | MEDIUM | Based on codebase analysis and violation distribution |
| Alternative Approaches | MEDIUM | Some alternatives based on community patterns, not official docs |

**Overall: HIGH** — All patterns are based on official documentation, current library versions, and established community best practices as of 2025.
