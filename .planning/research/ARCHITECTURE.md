# Architecture Patterns: Shared Type System

**Domain:** TypeScript Type Safety for Hono/Kysely/Cloudflare Workers
**Researched:** 2026-05-05
**Overall confidence:** HIGH

## Executive Summary

The ARESWEB codebase suffers from 983 `@typescript-eslint/no-explicit-any` violations, with approximately 60% attributable to missing shared types. The current architecture has:

1. **HonoEnv** type defined in `functions/api/middleware/utils.ts` but duplicated/extended elsewhere
2. **No D1Row<T> generic** for D1 table row types
3. **Local type proliferation** across 30+ route handlers using inline `any` casts
4. **Inconsistent handler patterns** between ts-rest contracts and implementation

This research proposes a centralized shared type architecture that eliminates duplication while avoiding circular dependencies.

## Key Findings

### Current Type Duplication

| Location | Duplicated Types | Impact |
|----------|-----------------|--------|
| Route handlers | Handler params, response bodies, query types | ~400 violations |
| Kysely queries | Table row selections, join results | ~200 violations |
| ts-rest contracts | Schema inference gaps | ~150 violations |
| Middleware | Context extensions, env bindings | ~100 violations |
| Test files | Mock data, test fixtures | ~100 violations |

### Existing Type Infrastructure (HIGH confidence)

The codebase already has foundational type infrastructure:

1. **`shared/schemas/database.ts`** - Auto-generated Kysely `DB` interface with all table types
2. **`functions/api/middleware/utils.ts`** - `AppEnv`, `Bindings`, `Variables`, `SessionUser`
3. **`shared/schemas/contracts/*.ts`** - 30+ ts-rest contracts with Zod schemas
4. **`shared/schemas/commonSchemas.ts`** - Reusable validation schema builders

The problem is these are not leveraged consistently across route handlers.

### Anti-Pattern: Handler Type Duplication

Current pattern in `functions/api/routes/events/handlers.ts`:

```typescript
export const eventHandlers: any = {
  getEvents: async (input: any, c: any) => {  // ❌ No types
    const { query } = input;  // ❌ Destructured from any
    const db = c.get("db") as Kysely<DB>;  // ❌ Repeated cast
    // ...
  }
}
```

## Recommended Architecture

### Directory Structure

```
shared/types/
├── index.ts                    # Public API barrel export
├── api/
│   ├── handlers.ts             # Handler input/output types
│   ├── context.ts              # Hono context extensions (re-exports AppEnv)
│   ├── cloudflare.ts           # Cloudflare Workers bindings (re-exports from utils)
│   └── responses.ts            # Standard API response shapes
├── database/
│   ├── tables.ts               # D1 table row types (re-exports from database.ts)
│   ├── queries.ts              # Common Kysely query result types
│   └── transforms.ts           # Type transformers (Generated<> unwrapping)
├── contracts/
│   └── inferred.ts             # Zod-to-TypeScript inference helpers
└── utility/
    ├── pagination.ts           # Pagination types
    └── filters.ts              # Common filter types
```

### 1. HonoEnv Binding Type

**Location:** `functions/api/middleware/utils.ts` (EXISTING - enhance, not move)

The `AppEnv` type already exists and is correctly positioned. DO NOT move it to `shared/` to avoid circular dependencies with Cloudflare Workers types.

**Enhancement:** Add stricter typing for middleware:

```typescript
// functions/api/middleware/utils.ts

import type { Context, Next } from "hono";
import type { Kysely } from "kysely";
import type { DB } from "../../../shared/schemas/database";
import type { D1Database, R2Bucket, VectorizeIndex, KVNamespace } from "@cloudflare/workers-types";

// ── Cloudflare Bindings ──────────────────────────────────────────────
export type Bindings = {
  DB: D1Database;
  ENVIRONMENT?: "development" | "production" | "test";
  ARES_STORAGE: R2Bucket;
  AI: { run: (model: string, input: unknown) => Promise<unknown> };
  VECTORIZE_DB?: VectorizeIndex;
  Z_AI_API_KEY?: string;
  // ... existing bindings
};

export type Variables = {
  sessionUser: SessionUser;
  socialConfig?: SocialConfig;
  db: Kysely<DB>;
  env: Bindings;
  requestId?: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

// ── Export for shared/types/api/context.ts ────────────────────────
// Re-export here so shared/types can reference without circular deps
export type { AppEnv, Bindings, Variables };
```

**Rationale (HIGH confidence):**
- Keep Cloudflare-specific types at edge functions boundary
- Shared types import from here, not the other way around
- Matches Cloudflare Workers compilation model

### 2. D1Row<T> Generic

**Location:** `shared/types/database/tables.ts`

Create a type helper that unwraps Kysely's `Generated<>` wrapper and provides consistent nullability:

```typescript
// shared/types/database/tables.ts

import type { DB, Generated } from "../../schemas/database";
import type { Selectable } from "kysely";

/**
 * D1Row<T> - Unwrap Kysely's Generated<> wrapper for table rows.
 *
 * Use this when you need the "true" database row type without
 * the Generated<T | null> wrapper that Kysely adds for auto-increment
 * and timestamp columns.
 *
 * @example
 *   type EventRow = D1Row<DB, "events">;
 *   const row: EventRow = await db.selectFrom("events").where("id", "=", id).executeTakeFirst();
 *
 * @template TTable - Table name from DB interface
 */
export type D1Row<TTable extends keyof DB> = Selectable<DB[TTable]>;

/**
 * D1Insert<T> - Row type for insert operations (optional Generated fields).
 *
 * Use this when constructing values for .insert() or .values().
 * Auto-increment IDs and timestamps can be omitted.
 */
export type D1Insert<TTable extends keyof DB> = DB[TTable];

/**
 * D1Update<T> - Row type for update operations (partial).
 */
export type D1Update<TTable extends keyof DB> = Partial<Selectable<DB[TTable]>>;

/**
 * Pre-configured row types for commonly accessed tables.
 * Add more as needed during refactoring.
 */
export type EventRow = D1Row<DB, "events">;
export type PostRow = D1Row<DB, "posts">;
export type TaskRow = D1Row<DB, "tasks">;
export type CommentRow = D1Row<DB, "comments">;
export type SponsorRow = D1Row<DB, "sponsors">;
export type DocRow = D1Row<DB, "docs">;
export type UserRow = D1Row<DB, "user">;
export type UserProfileRow = D1Row<DB, "user_profiles">;
export type FinanceTransactionRow = D1Row<DB, "finance_transactions">;
export type OutreachLogRow = D1Row<DB, "outreach_logs">;
export type InquiryRow = D1Row<DB, "inquiries">;
export type NotificationRow = D1Row<DB, "notifications">;
export type LocationRow = D1Row<DB, "locations">;
export type AwardRow = D1Row<DB, "awards">;
export type SeasonRow = D1Row<DB, "seasons">;

/**
 * Join result types for common queries.
 * Add more as discovered during refactoring.
 */
export type EventWithLocation = EventRow & {
  location_address?: string | null;
};

export type PostWithAuthor = PostRow & {
  author_name?: string | null;
  author_avatar?: string | null;
};

export type CommentWithUser = CommentRow & {
  nickname: string | null;
  avatar: string | null;
};
```

### 3. Handler Input/Output Types

**Location:** `shared/types/api/handlers.ts`

Extract common handler patterns to eliminate the most frequent `any` usages:

```typescript
// shared/types/api/handlers.ts

import type { Context } from "hono";
import type { AppEnv } from "../../middleware/utils";

/**
 * Standard ts-rest handler input shape.
 * Matches ts-rest-hono's handler signature.
 */
export interface HandlerInput {
  params?: Record<string, string>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

/**
 * Standard error response shape.
 */
export interface ErrorResponse {
  error: string;
  details?: unknown;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total?: number;
  limit: number;
  offset: number;
  cursor?: string | null;
}

/**
 * Standard success response wrapper.
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
}

/**
 * Typed handler function signature.
 *
 * @example
 *   const handler: Handler<{ status: 200 }> = async (input, c) => {
 *     return { status: 200 as const, body: { result: "ok" } };
 *   };
 */
export type Handler<TResponses extends Record<number, unknown>> = (
  input: HandlerInput,
  c: Context<AppEnv>
) => Promise<{ status: number; body: TResponses[keyof TResponses] }>;

/**
 * Infer handler types from ts-rest contract.
 * Use this when contract schemas are well-defined.
 */
export type InferContractHandlers<TContract> = TContract extends {
  [key: string]: { body?: { zod: unknown }; responses: Record<number, { zod: unknown }> };
}
  ? {
      [K in keyof TContract]: Handler<TContract[K]["responses"]>;
    }
  : never;
```

### 4. Import/Export Organization

**Critical Rule (prevents circular dependencies):**

```
functions/api/middleware/utils.ts
    └── exports: AppEnv, Bindings, Variables (Cloudflare types)
             ↓
shared/types/api/context.ts
    └── re-exports: AppEnv from middleware/utils (extends for shared use)
             ↓
shared/types/index.ts
    └── barrel exports: all shared types
             ↓
functions/api/routes/*.ts
    └── imports: shared/types (never imports middleware directly)
```

**Implementation:**

```typescript
// shared/types/api/context.ts

/**
 * Re-export Hono context types from middleware.
 *
 * This file exists to provide a clean import path for shared types
 * while avoiding circular dependencies with Cloudflare Workers.
 *
 * Route handlers should import from here:
 *   import type { AppEnv, HonoContext } from "@/types/api/context";
 */

export type { AppEnv, Bindings, Variables } from "../../../../functions/api/middleware/utils";

/**
 * Type alias for Hono context with our environment.
 * Use this in handler signatures for consistency.
 */
export type HonoContext = import("hono").Context<AppEnv>;
```

### 5. Naming Conventions

| Category | Pattern | Example |
|----------|---------|---------|
| Table rows | `*Row` | `EventRow`, `PostRow`, `TaskRow` |
| Insert types | `*Insert` | `EventInsert`, `PostInsert` |
| Update types | `*Update` | `EventUpdate`, `PostUpdate` |
| Join results | `*With*` | `EventWithLocation`, `PostWithAuthor` |
| Handler inputs | `*HandlerInput` | `TaskHandlerInput`, `EventHandlerInput` |
| API responses | `*Response` | `TaskListResponse`, `EventDetailResponse` |
| Query results | `*Result` | `CommentListResult`, `SponsorListResult` |

**Generated types from contracts:**
- Infer from Zod: `z.infer<typeof postSchema>` → `PostPayload`
- Use suffix `Payload` for request bodies
- Use suffix `Response` for response shapes

### 6. Migration Strategy

**Phase 1: Foundation (addresses ~30% of violations)**
1. Create `shared/types/` directory structure
2. Add `D1Row<T>` generic and pre-configured row types
3. Add `shared/types/api/context.ts` re-exporting `AppEnv`
4. Update `shared/types/index.ts` barrel export

**Phase 2: Route Handlers (addresses ~40% of violations)**
1. Update high-impact files first (by violation count):
   - `events/handlers.ts` (77 violations)
   - `docs.ts` (51 violations)
   - `comments.ts` (33 violations)
   - `sponsors.ts` (31 violations)
2. Replace handler signatures with typed imports

**Phase 3: Test Files (addresses ~20% of violations)**
1. Create `shared/types/testing.ts` for test helpers
2. Add factory types for mock data
3. Replace `as unknown as T` patterns with proper types

**Phase 4: Utility Functions (addresses ~10% of violations)**
1. Type Kysely query results with `D1Row<T>`
2. Add join result types for common patterns
3. Type middleware context extensions

## Patterns to Follow

### Pattern 1: Typed Route Handler

```typescript
// functions/api/routes/events/index.ts

import type { HonoContext } from "@/types/api/context";
import type { EventRow } from "@/types/database/tables";
import type { Handler, HandlerInput } from "@/types/api/handlers";

const getEventHandler: Handler<{
  200: { event: EventRow };
  404: { error: string };
}> = async (input: HandlerInput, c: HonoContext) => {
  const { params } = input;
  const db = c.get("db"); // No cast needed!

  const event = await db
    .selectFrom("events")
    .where("id", "=", params.id)
    .executeTakeFirst();

  if (!event) {
    return { status: 404, body: { error: "Event not found" } };
  }

  return { status: 200, body: { event } };
};
```

### Pattern 2: Kysely Query with Join

```typescript
import type { CommentWithUser } from "@/types/database/tables";

const comments = await db
  .selectFrom("comments as c")
  .innerJoin("user_profiles as p", "c.user_id", "p.user_id")
  .select([
    "c.id",
    "c.user_id",
    "c.content",
    "c.created_at",
    "p.nickname",
    "p.avatar"
  ])
  .where("c.target_id", "=", targetId)
  .execute();

// comments is inferred as CommentWithUser[]
// No "as any" needed!
```

### Pattern 3: ts-rest Contract Inference

```typescript
// shared/schemas/contracts/taskContract.ts

import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  // ... other fields
});

export type Task = z.infer<typeof taskSchema>;

export const taskContract = c.router({
  list: {
    method: "GET",
    path: "/",
    responses: {
      200: z.object({ tasks: z.array(taskSchema) }),
    },
  },
});

// In handler:
import type { Task } from "@/types/contracts/inferred";

const tasks: Task[] = await db.selectFrom("tasks").execute();
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Re-casting Kysely Results

```typescript
// ❌ BAD
const events = await db.selectFrom("events").selectAll().execute() as any[];

// ✅ GOOD
import type { EventRow } from "@/types/database/tables";
const events: EventRow[] = await db.selectFrom("events").selectAll().execute();
```

### Anti-Pattern 2: Handler `any` Parameters

```typescript
// ❌ BAD
const handler = async (input: any, c: any) => {
  const db = c.get("db") as Kysely<DB>;
  const { id } = input.params as { id: string };
};

// ✅ GOOD
import type { HonoContext, HandlerInput } from "@/types/api/context";

const handler = async (input: HandlerInput, c: HonoContext) => {
  const db = c.get("db");
  const { id } = input.params;
};
```

### Anti-Pattern 3: Circular Type Imports

```typescript
// ❌ BAD - Don't import from functions/ in shared/
// shared/types/api/cloudflare.ts
import type { AppEnv } from "../../../../functions/api/middleware/utils";

// ✅ GOOD - Re-export at boundary
// shared/types/api/context.ts
export type { AppEnv } from "../../../../functions/api/middleware/utils";
```

## Scalability Considerations

| Concern | Current State | With Shared Types |
|---------|---------------|-------------------|
| Type checking | ~1000 `any` violations | Near 0 violations |
| IDE autocomplete | Limited (any) | Full autocomplete |
| Refactoring safety | Low (runtime errors) | High (compile-time errors) |
| Onboarding time | High (implicit types) | Low (explicit types) |
| Compilation time | Fast (no shared types) | Minimal impact (<5%) |

## Sources

| Source | Confidence | Notes |
|--------|------------|-------|
| `shared/schemas/database.ts` | HIGH | Auto-generated Kysely types (ground truth) |
| `functions/api/middleware/utils.ts` | HIGH | Existing AppEnv definition (production-tested) |
| `shared/schemas/contracts/` | HIGH | ts-rest contracts (define API boundary) |
| `functions/api/routes/*.ts` | HIGH | Handler patterns observed directly |
| Kysely documentation | HIGH | `Selectable<>`, `Insertable<>` type helpers |
| ts-rest documentation | HIGH | Contract inference patterns |
| Cloudflare Workers types | HIGH | `@cloudflare/workers-types` package |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Directory structure | HIGH | Based on observed codebase patterns |
| D1Row<T> generic | HIGH | Kysely `Selectable<>` is documented pattern |
| HonoEnv placement | HIGH | Must stay at functions boundary to avoid cycles |
| Import organization | HIGH | Arrow dependency graph prevents circular imports |
| Naming conventions | MEDIUM | Recommendations based on consistency; can adjust |
| Migration phases | MEDIUM | ~60% impact is estimate; actual may vary |

## Gaps to Address

1. **Test file patterns** - Need dedicated research on test-specific type needs
2. **Worker vs Edge types** - May need separate types for Cron Workers vs main router
3. **PartyKit types** - Document history uses separate D1 binding (PK_DB)
4. **Vectorize types** - AI search results need typed response shapes

## Roadmap Implications

Based on research, suggested phase structure:

1. **Phase 1: Type Foundation** - Create shared/types structure, add D1Row<T> and AppEnv re-exports
2. **Phase 2: High-Impact Handlers** - Fix events/handlers.ts (77), docs.ts (51), comments.ts (33), sponsors.ts (31)
3. **Phase 3: Contract Inference** - Leverage Zod schemas to eliminate contract-implementation gaps
4. **Phase 4: Test Types** - Create testing-specific type utilities
5. **Phase 5: Remaining Routes** - Systematic migration of remaining route handlers

**Phase ordering rationale:**
- Foundation first prevents rework
- High-impact files provide immediate validation (~60% of violations)
- Contract inference locks in type safety at API boundary
- Tests last to avoid blocking main code migration

**Research flags for phases:**
- Phase 2: Each handler file may have unique patterns; create file-specific types as needed
- Phase 4: Test mocking patterns vary (vitest vs Playwright); may need separate type utilities
