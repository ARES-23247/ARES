# Phase 29: Contract Inference - Research

**Researched:** 2026-05-05
**Domain:** TypeScript type safety, ts-rest contract inference, Zod runtime validation
**Confidence:** HIGH

## Summary

Phase 29 focuses on eliminating `as any` casts from ts-rest router setup while enabling proper contract type inference and runtime validation. The codebase has 33 ts-rest contracts already defined with Zod schemas, but 15+ route files use `as any` when calling `s.router(contract, handlers as any)` and `createHonoEndpoints()`. The root cause is a mismatch between handler function signatures and the expected `AppRouteImplementation` type from ts-rest-hono.

**Primary recommendation:** Enable response validation and fix handler signatures to match `AppRouteImplementation<T, AppEnv>` type from ts-rest-hono, eliminating all `as any` casts while adding runtime Zod validation at API boundaries.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Contract type inference | API / Backend | Frontend (consumption) | ts-rest contracts define API boundaries; backend implements, frontend consumes |
| Runtime request validation | API / Backend | — | Zod schemas validate incoming requests at API entry points |
| Runtime response validation | API / Backend | — | Response validation ensures handlers return contract-compliant responses |
| Type export for frontend | Shared | — | Contract types are consumed by frontend via `@ts-rest/react-query` |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @ts-rest/core | 3.52.1 [VERIFIED: npm registry] | Contract definition primitives | TypeScript-first API contracts with Zod integration |
| ts-rest-hono | 0.5.0 [VERIFIED: npm registry] | Hono adapter for ts-rest | Official ts-rest integration with Hono framework |
| zod | 4.4.3 [VERIFIED: npm registry] | Runtime validation | Schema validation with TypeScript type inference |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| hono | (existing) | Web framework | Already used across all route files |
| kysely | (existing) | Type-safe SQL | Database queries with SelectableRow/InsertableRow types |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ts-rest | tRPC | tRPC requires end-to-end adoption; ts-rest allows gradual migration and standard REST |
| Zod schemas | Yup / io-ts | Zod has better TypeScript inference and ts-rest integration |
| Runtime validation | Compile-time only | Runtime validation catches data drift between database and contracts |

**Installation:**
```bash
# All packages already installed
npm list @ts/rest/core ts-rest-hono zod
```

**Version verification:**
```bash
npm view @ts-rest/core version  # 3.52.1 (current as of 2026-05-05)
npm view ts-rest-hono version   # 0.5.0 (current as of 2026-05-05)
npm view zod version            # 4.4.3 (current as of 2026-05-05)
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Browser)                          │
│  Consumes contract types via @ts-rest/react-query                  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTP Request
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Hono Router (API Layer)                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  createHonoEndpoints(contract, router, app, options)        │  │
│  │    - Validates request using Zod schemas (if enabled)        │  │
│  │    - Calls handler with AppRouteInput type                   │  │
│  │    - Validates response using Zod schemas (if enabled)       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Route Handler (AppRouteImplementation)                 │
│  async (input: AppRouteInput<T>, c: Context<Env>) =>                │
│    Promise<ServerInferResponses<T>> | Response                      │
│                                                                     │
│  Current state: Most handlers use HandlerInput/HonoContext         │
│  Target state: Use inferred AppRouteInput from contract            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    D1 Database / Services                           │
│  Kysely queries with SelectableRow<T> / InsertableRow<T>           │
└─────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
functions/api/routes/
├── analytics.ts          # Router with proper contract inference
├── badges.ts             # Router with proper contract inference
├── sponsors.ts           # Router with proper contract inference
├── docs.ts               # Router with proper contract inference
├── ...
└── middleware/
    └── utils.ts          # AppEnv type definition

shared/
├── schemas/
│   ├── contracts/
│   │   ├── analyticsContract.ts    # 33 contracts with Zod schemas
│   │   ├── sponsorContract.ts
│   │   └── ...
│   └── database.ts                 # Kysely DB schema
└── types/
    ├── api.ts                      # HandlerInput, HonoContext (Phase 27)
    ├── contracts.ts                # ContractHandler, ContractInput (Phase 27)
    └── database.ts                 # D1Row, SelectableRow, InsertableRow (Phase 27)
```

### Pattern 1: Proper ts-rest Handler Type Inference

**What:** Use `AppRouteImplementation<T, Env>` type from ts-rest-hono instead of custom `HandlerInput` type.

**When to use:** All route handlers registered with `s.router(contract, handlers)`.

**Why:** The `AppRouteImplementation` type automatically infers request body, params, and query types from the contract's Zod schemas, and validates response types match the contract.

**Example:**
```typescript
// Source: ts-rest-hono@0.5.0 dist/index.d.cts (lines 191-199)

import { initServer, createHonoEndpoints } from "ts-rest-hono";
import { analyticsContract } from "~/shared/schemas/contracts/analyticsContract";
import type { AppEnv } from "../middleware/utils";

const s = initServer<AppEnv>();

// BEFORE: Handler with custom types (requires 'as any' cast)
const analyticsHandlers = {
  trackPageView: async (
    { body }: { body: { path?: string; category?: string } }, 
    c: Context<AppEnv>
  ) => {
    // Handler logic
    return { status: 200 as const, body: { success: true } };
  }
};
const analyticsTsRestRouter = s.router(analyticsContract, analyticsHandlers as any);

// AFTER: Handler with inferred types (no 'as any' needed)
const analyticsHandlers = {
  trackPageView: async (input, c) => {
    // input.body is automatically typed as { path?: string; category?: string; referrer?: string; "cf-turnstile-response"?: string }
    // input.query is automatically typed as never (no query params)
    // input.params is automatically typed as never (no path params)
    
    const { path, category, referrer } = input.body;
    // Handler logic
    return { status: 200, body: { success: true } };
    //       ^^^^^^^^^^^^ Type error if body doesn't match contract
  }
};
const analyticsTsRestRouter = s.router(analyticsContract, analyticsHandlers);
```

### Pattern 2: Enable Runtime Validation Options

**What:** Pass options object to `createHonoEndpoints()` to enable request/response validation.

**When to use:** All router setups where runtime validation is desired (recommended for production APIs).

**Why:** ts-rest-hono validates requests and responses using Zod schemas at runtime, catching API contract violations before they reach clients.

**Example:**
```typescript
// Source: ts-rest-hono@0.5.0 dist/index.d.cts (lines 200-213)

type Options<E extends Env = Env> = {
  responseValidation?: boolean | ((c: Context<E, any>) => boolean);
  requestValidationErrorHandler?: (error: RequestValidationError, c: Context<E, any>) => {
    error: unknown;
    status: StatusCode;
  };
  responseValidationErrorHandler?: (error: ResponseValidationError, c: Context<E, any>) => {
    error: unknown;
    status: StatusCode;
  };
};

// BEFORE: No validation
createHonoEndpoints(analyticsContract, analyticsTsRestRouter, analyticsRouter);

// AFTER: Enable response validation
createHonoEndpoints(
  analyticsContract,
  analyticsTsRestRouter,
  analyticsRouter,
  {
    responseValidation: true,  // Validate all responses against Zod schemas
    responseValidationErrorHandler: (err, c) => {
      console.error('[Contract] Response validation failed:', err.cause);
      return {
        error: { message: 'Internal server error' },
        status: 500
      };
    }
  }
);
```

### Pattern 3: Extract Contract Types for Frontend

**What:** Export contract types for frontend consumption via `@ts-rest/react-query` or direct type imports.

**When to use:** Frontend components that need API contract types for type-safe API calls.

**Why:** Ensures frontend and backend stay in sync — contract changes propagate as TypeScript errors.

**Example:**
```typescript
// shared/schemas/contracts/analyticsContract.ts
import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const analyticsContract = c.router({
  trackPageView: {
    method: "POST",
    path: "/track",
    body: z.object({
      path: z.string().optional(),
      category: z.string().optional(),
    }),
    responses: {
      200: z.object({ success: z.boolean() }),
      500: z.object({ success: z.boolean() }),
    },
  },
  // ... more routes
});

// Export inferred types for frontend use
export type AnalyticsContract = typeof analyticsContract;
```

```typescript
// Frontend usage (example)
import { initClient } from "@ts-rest/core";
import { analyticsContract } from "~/shared/schemas/contracts/analyticsContract";

const client = initClient(analyticsContract, {
  baseUrl: "/api",
  baseHeaders: {},
});

// Fully typed API call
const result = await client.trackPageView({
  body: { path: "/test", category: "system" }
  //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Type-checked against contract
});
```

### Anti-Patterns to Avoid

- **Anti-pattern 1: Using `HandlerInput` with `s.router()`**
  - **Problem:** `HandlerInput` is a custom type that doesn't match `AppRouteImplementation`, requiring `as any` cast
  - **Solution:** Use inferred handler types by omitting type annotations on handler parameters

- **Anti-pattern 2: Disabling response validation to fix type errors**
  - **Problem:** Hides contract violations; handlers can return non-compliant responses
  - **Solution:** Fix handler return types to match contract exactly

- **Anti-pattern 3: Adding `as any` to handler objects**
  - **Problem:** Bypasses all contract type safety; defeats purpose of ts-rest
  - **Solution:** Ensure handler signatures match `AppRouteImplementation<T, Env>` expected by `s.router()`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Request validation middleware | Custom Zod validation in each route | ts-rest-hono's built-in `validateRequest()` | Handles path params, query, headers, body validation automatically |
| Response validation middleware | Manual response schema validation | ts-rest-hono's `validateResponse()` via `responseValidation` option | Automatically validates all responses against contract Zod schemas |
| Type inference for contracts | Manual type definitions for API endpoints | `AppRouteImplementation` and `ServerInferResponses` from ts-rest-hono | Types are inferred from contract definitions, eliminating duplication |
| API client generation | Custom fetch wrappers | `@ts-rest/react-query` or `@ts-rest/fetch` | Generates fully-typed API clients from contracts |

**Key insight:** ts-rest-hono already provides request/response validation and type inference. The issue is that handler signatures use custom `HandlerInput` type instead of the expected `AppRouteImplementation` type, causing type mismatches that require `as any` casts.

## Runtime State Inventory

> Not applicable — this is a greenfield type safety improvement phase, not a rename/refactor phase.

**Category:** None — No runtime state changes required.

## Common Pitfalls

### Pitfall 1: Type Mismatch Between Handler and Contract
**What goes wrong:** Handler functions use `HandlerInput` type (from Phase 27) but `s.router()` expects `AppRouteImplementation<T, Env>`, causing TypeScript errors and requiring `as any` cast.

**Why it happens:** Phase 27 created `HandlerInput` as a generic handler type before the ts-rest integration pattern was fully established. The custom type doesn't match ts-rest's expected signature.

**How to avoid:** Remove type annotations from handler parameters and let ts-rest infer the types from the contract:
```typescript
// BEFORE (requires 'as any')
async ({ body }: HandlerInput, c: HonoContext) => { ... }

// AFTER (types inferred)
async (input, c) => {
  const { body, query, params } = input;  // Fully typed from contract
  ...
}
```

**Warning signs:** TypeScript error "Type 'HandlerInput' is not assignable to type 'AppRouteImplementation'" when calling `s.router()`.

### Pitfall 2: Missing Response Validation
**What goes wrong:** Handlers return responses that don't match the contract (e.g., missing fields, wrong types), but TypeScript doesn't catch it because response validation is disabled.

**Why it happens:** `createHonoEndpoints()` is called without `responseValidation: true` option, so runtime validation is skipped.

**How to avoid:** Always enable `responseValidation: true` in `createHonoEndpoints()` options:
```typescript
createHonoEndpoints(
  contract,
  router,
  app,
  { responseValidation: true }  // Catch contract violations at runtime
);
```

**Warning signs:** API returns 500 errors with "Response validation failed" message (only if validation enabled).

### Pitfall 3: Incorrect Status Code Assertions
**What goes wrong:** Handlers use `status: 200 as const` but contract expects different status code, or returns status not defined in contract responses.

**Why it happens:** `ServerInferResponses<T>` only allows status codes defined in the contract. Using a status code outside the contract causes type errors.

**How to avoid:** Ensure all returned status codes are defined in the contract's `responses` object:
```typescript
// Contract definition
responses: {
  200: z.object({ success: z.boolean() }),
  404: z.object({ error: z.string() }),
}

// Handler can only return 200 or 404
return { status: 200, body: { success: true } };  // ✓ Valid
return { status: 404, body: { error: "Not found" } };  // ✓ Valid
return { status: 500, body: { error: "Server error" } };  // ✗ Type error
```

**Warning signs:** TypeScript error "Type '500' is not assignable to type '200 | 404'".

### Pitfall 4: Zod Schema Type Drift
**What goes wrong:** Database schema changes but contract Zod schemas aren't updated, causing runtime validation failures.

**Why it happens:** Contracts are defined separately from database schema; no automated synchronization.

**How to avoid:** Run tests with response validation enabled to catch schema drift; consider generating contracts from Kysely schema types.

**Warning signs:** Response validation errors in production logs after database migration.

## Code Examples

Verified patterns from official sources:

### Example 1: Full Router Setup with Type Inference
```typescript
// Source: ts-rest-hono@0.5.0 dist/index.d.cts (lines 215-220)
// Combined with project pattern from analytics.ts

import { Hono } from "hono";
import { initServer, createHonoEndpoints } from "ts-rest-hono";
import { analyticsContract } from "~/shared/schemas/contracts/analyticsContract";
import type { AppEnv } from "../middleware/utils";

const s = initServer<AppEnv>();
export const analyticsRouter = new Hono<AppEnv>();

// Handler types are inferred from analyticsContract
const analyticsHandlers = {
  trackPageView: async (input, c) => {
    // input.body type: { path?: string; category?: string; referrer?: string; "cf-turnstile-response"?: string }
    // input.query type: never
    // input.params type: never
    
    const db = c.get("db");
    const { path, category, referrer } = input.body;
    
    await db.insertInto("page_analytics")
      .values({
        path: path || "/",
        category: category || "system",
        referrer: referrer || "",
        user_agent: c.req.header("user-agent") || "unknown",
        timestamp: new Date().toISOString()
      })
      .execute();
    
    // Response type is validated against contract
    return { status: 200, body: { success: true } };
  },
  
  getStats: async (_input, c) => {
    // input is unused for GET requests without body/query/params
    const db = c.get("db");
    const [postsCount, eventsCount] = await Promise.all([
      db.selectFrom("posts").select(eb => eb.fn.count("slug").as("total")).executeTakeFirst(),
      db.selectFrom("events").select(eb => eb.fn.count("id").as("total")).executeTakeFirst(),
    ]);
    
    return {
      status: 200,
      body: {
        posts: Number(postsCount?.total || 0),
        events: Number(eventsCount?.total || 0),
        integrations: {
          zulip: !!dbSettings["ZULIP_API_KEY"],
          github: !!dbSettings["GITHUB_PAT"],
          // ... other integrations
        }
      }
    };
  }
};

// No 'as any' cast needed - types match perfectly
const analyticsTsRestRouter = s.router(analyticsContract, analyticsHandlers);

// Enable runtime response validation
createHonoEndpoints(
  analyticsContract,
  analyticsTsRestRouter,
  analyticsRouter,
  {
    responseValidation: true,
    responseValidationErrorHandler: (err, c) => {
      console.error('[Contract] Response validation failed:', err.cause);
      return { error: { message: 'Internal server error' }, status: 500 };
    }
  }
);

export default analyticsRouter;
```

### Example 2: Handler with Path Parameters and Query
```typescript
// Source: ts-rest-hono@0.5.0 dist/index.d.cts (lines 161-167)

const sponsorHandlers = {
  getSponsor: async (input, c) => {
    // input.params type: { id: string } (inferred from path: '/:id')
    // input.query type: never
    // input.body type: never (GET request)
    
    const db = c.get("db");
    const { id } = input.params;
    
    const sponsor = await db.selectFrom("sponsors")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    
    if (!sponsor) {
      return { status: 404, body: { error: "Sponsor not found" } };
    }
    
    return { status: 200, body: { sponsor } };
  },
  
  updateSponsor: async (input, c) => {
    // input.params type: { id: string }
    // input.body type: { name?: string; tier?: string; ... }
    
    const db = c.get("db");
    const { id } = input.params;
    const updates = input.body;
    
    await db.updateTable("sponsors")
      .set(updates)
      .where("id", "=", id)
      .execute();
    
    return { status: 200, body: { success: true } };
  }
};
```

### Example 3: Handling File Uploads with multipart/form-data
```typescript
// Source: ts-rest-hono@0.5.0 dist/index.d.cts (lines 177-194)

const mediaHandlers = {
  uploadImage: async (input, c) => {
    // input.files type: unknown (files from multipart form)
    // input.file type: unknown (single file from multipart form)
    
    const formData = await c.req.parseBody();
    const file = formData["file"] as File;
    
    if (!file) {
      return { status: 400, body: { error: "No file uploaded" } };
    }
    
    // Process file upload...
    
    return { status: 200, body: { url: uploadedUrl } };
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual API type definitions | ts-rest contracts with Zod | v6.7 (Phase 27-29) | End-to-end type safety from contract to implementation |
| No runtime validation | ts-rest-hono automatic request/response validation | v6.7 (Phase 29) | Catches API contract violations before they reach clients |
| Custom `HandlerInput` type | `AppRouteImplementation` inferred from contract | v6.7 (Phase 29) | Eliminates type duplication and `as any` casts |
| `as any` to bypass type errors | Proper contract type inference | v6.7 (Phase 29) | Full type safety at API boundaries |

**Deprecated/outdated:**
- **HandlerInput type for ts-rest handlers**: Use inferred `AppRouteInput<T>` type instead. `HandlerInput` is still useful for non-ts-rest Hono middleware, but not for route handlers registered with `s.router()`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | All 33 ts-rest contracts have complete Zod schemas defined | Standard Stack | LOW - Verified via file listing of `shared/schemas/contracts/*.ts` |
| A2 | ts-rest-hono@0.5.0 response validation is production-ready | Architecture Patterns | LOW - Verified via source code inspection showing full Zod integration |
| A3 | Frontend consumes contract types via `@ts-rest/react-query` | Architectural Responsibility Map | MEDIUM - Need to verify frontend imports; fallback is direct type imports |
| A4 | Removing `HandlerInput` type annotations won't break existing middleware | Common Pitfalls | LOW - Type inference provides same types; middleware uses `HonoContext` directly |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Should we enable request validation or only response validation?**
   - **What we know:** Request validation is enabled by default in ts-rest-hono. Response validation must be explicitly enabled via options.
   - **What's unclear:** Whether request validation might break existing clients sending non-compliant requests.
   - **Recommendation:** Enable response validation first (Phase 29), then audit request validation in a follow-up phase. Request validation is safer to roll out gradually.

2. **How to handle union response types (e.g., 200 | 500)?**
   - **What we know:** Contracts define multiple status codes (200, 404, 500). TypeScript requires handlers to return all possible statuses.
   - **What's unclear:** Whether current handlers correctly handle all contract-defined error cases.
   - **Recommendation:** Audit each contract's response definitions and ensure handlers return all defined status codes. Use response validation to catch violations.

3. **Should we generate contracts from Kysely schema types?**
   - **What we know:** Kysely provides `Selectable<T>` and `Insertable<T>` types. Current contracts are manually defined.
   - **What's unclear:** Effort to build contract generator vs. manual maintenance.
   - **Recommendation:** Deferred to Phase 32 (Validation) - maintain manual contracts for now, consider generator if schema drift becomes problematic.

## Environment Availability

> Phase has external dependencies.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| @ts-rest/core | Contract definition | ✓ | 3.52.1 | — |
| ts-rest-hono | Hono adapter | ✓ | 0.5.0 | — |
| zod | Runtime validation | ✓ | 4.4.3 | — |
| hono | Web framework | ✓ | (existing) | — |
| kysely | Database queries | ✓ | (existing) | — |
| TypeScript | Type checking | ✓ | 5.8+ (inferred) | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.ts (project root) |
| Quick run command | `npm test -- functions/api/routes/analytics.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANTI_PATTERN_4 | Eliminate runtime type assumptions at API boundaries | unit | `npm test -- functions/api/routes/*.test.ts` | ✅ 33 test files exist |
| CONTRACT_INFERENCE | ts-rest contracts infer handler types correctly | integration | `npm test -- functions/api/routes/analytics.test.ts` | ✅ Wave 0 |
| CONTRACT_INFERENCE | Runtime Zod validation catches contract violations | unit | (see below) | ❌ Wave 0 gap |

### Sampling Rate
- **Per task commit:** `npm test -- <modified-route>.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] **Test for runtime validation** — Need to verify `responseValidation: true` catches contract violations
- [ ] **Test for contract type inference** — Need to verify handler types match `AppRouteImplementation`
- [ ] **Test contract completeness** — Need to verify all contract endpoints have handler implementations

**Approach to fill gaps:**
1. Add test case that intentionally returns wrong response shape and verifies validation error
2. Add type assertion test: `const handlers: RecursiveRouterObj<typeof contract, AppEnv> = actualHandlers`
3. Add test that enumerates all contract routes and verifies handler exists

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled). Omit only if explicitly `false` in config.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Cloudflare Zero Trust headers (see Zero Trust Security skill) |
| V3 Session Management | yes | Session tokens via Cloudflare Access |
| V4 Access Control | yes | Role-based middleware (ensureAuth, ensureAdmin) |
| V5 Input Validation | **yes** | **Zod schemas in ts-rest contracts + runtime validation** |
| V6 Cryptography | yes | Cloudflare Workers crypto APIs |

### Known Threat Patterns for ts-rest + Hono APIs

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via query params | Tampering | Kysely parameterized queries (no raw SQL concatenation) |
| XSS via unvalidated input | Tampering | Zod schemas strip unknown fields; runtime validation catches malformed input |
| Type confusion attacks | Spoofing | Runtime Zod validation prevents type coercion attacks |
| API contract abuse | Tampering | Response validation ensures handlers don't leak data via unexpected fields |
| DoS via complex queries | Denial of Service | Rate limiting middleware (already in place) |

**Security-specific considerations for this phase:**
- **Response validation prevents data leaks:** If handler accidentally returns extra fields not in contract, `responseValidation: true` strips them
- **Request validation prevents injection:** Zod schemas enforce type constraints before data reaches database queries
- **Contract transparency:** Security audit can review Zod schemas to understand expected input/output shapes

## Sources

### Primary (HIGH confidence)
- **ts-rest-hono@0.5.0 type definitions** - `node_modules/ts-rest-hono/dist/index.d.cts` (lines 1-223)
- **ts-rest-hono@0.5.0 implementation** - `node_modules/ts-rest-hono/dist/index.mjs` (validation logic)
- **npm registry** - Package versions verified via `npm view`
- **Project codebase** - `functions/api/routes/*.ts` (15+ router files analyzed)

### Secondary (MEDIUM confidence)
- **ts-rest documentation** - https://ts-rest.com/ (official docs, verified 2026-05-05)
- **ts-rest GitHub issues** - Type inference discussions (validation patterns confirmed)

### Tertiary (LOW confidence)
- **Community blog posts** - ts-rest + Hono integration patterns (verified against source code)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified via npm registry and package.json
- Architecture: HIGH - ts-rest-hono source code inspected; type definitions verified
- Pitfalls: HIGH - Based on actual code analysis of 15+ router files in codebase

**Research date:** 2026-05-05
**Valid until:** 30 days (ts-rest and ts-rest-hono are stable libraries with monthly releases)
