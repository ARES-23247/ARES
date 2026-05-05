# Phase 29.1: Remaining Route Contract Inference - Research

**Researched:** 2026-05-05
**Domain:** TypeScript type safety, ts-rest contract inference, Zod runtime validation
**Confidence:** HIGH

## Summary

Phase 29 completed contract inference migration for 15 route files (analytics.ts + 14 files in plan 29-02). However, 11 additional route files still require migration to eliminate `as any` casts and enable runtime response validation. These files were either intentionally excluded from Phase 29 or use handler modules that weren't covered.

**Primary recommendation:** Apply the Phase 29 contract inference pattern (AppRouteInput, remove `as any`, enable responseValidation) to the remaining 11 route files: awards.ts, entities.ts, judges.ts, locations.ts, posts.ts, tasks.ts, tba.ts, users.ts, zulip.ts, inquiries/index.ts, outreach/index.ts, media/index.ts.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Contract type inference | API / Backend | Frontend (consumption) | ts-rest contracts define API boundaries; backend implements, frontend consumes |
| Runtime request validation | API / Backend | — | Zod schemas validate incoming requests at API entry points |
| Runtime response validation | API / Backend | — | Response validation ensures handlers return contract-compliant responses |
| Handler module type inference | API / Backend | — | Handler modules (handlers.ts) use same pattern as inline handlers |

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

**Installation:**
```bash
# All packages already installed
npm list @ts-rest/core ts-rest-hono zod
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
                ┌───────────────┴───────────────┐
                ▼                               ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│  Inline Handlers          │   │  Handler Modules (handlers.ts)  │
│  (posts.ts, judges.ts)    │   │  (inquiries/, outreach/, media/) │
│  async (input, c) => {    │   │  export const handlers = {       │
│    const { id } = input    │   │    handler: async (input, c)    │
│  }                         │   │  }                               │
└───────────────────────────┘   └─────────────────────────────────┘
```

### Contract Inference Pattern (Phase 29)

**BEFORE (with `as any` cast):**
```typescript
// handlers.ts
export const handlers = {
  getItems: async ({ query }: { query: { limit?: number } }, c: Context<AppEnv>) => {
    const { limit = 10 } = query;
    return { status: 200, body: { items: [] } };
  }
};

// index.ts
const router = s.router(myContract, handlers as any);
createHonoEndpoints(myContract, router, app);
```

**AFTER (with type inference):**
```typescript
// handlers.ts
export const handlers = {
  getItems: async (input, c) => {
    const { limit = 10 } = input.query;
    return { status: 200, body: { items: [] } };
  }
};

// index.ts
const router = s.router(myContract, handlers);
createHonoEndpoints(
  myContract,
  router,
  app,
  {
    responseValidation: true,
    responseValidationErrorHandler: (err, c) => {
      console.error('[Contract] Response validation failed:', err.cause);
      return { error: { message: 'Internal server error' }, status: 500 };
    }
  }
);
```

### Recommended Project Structure
```
functions/api/routes/
├── [module]/
│   ├── index.ts         # Hono router, s.router setup, createHonoEndpoints
│   ├── handlers.ts      # Handler implementations (export const handlers)
│   └── [module].test.ts # Tests
├── [file].ts            # Single-file route (handlers inline)
```

### Anti-Patterns to Avoid
- **`as any` cast on handlers object**: Hides type mismatches between contract and handler signatures
- **Explicit `Context<AppEnv>` parameter**: Use inferred `c` parameter instead
- **Manual type annotations on input**: Let ts-rest-hono infer from contract

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Handler type inference | Custom `HandlerInput<T>` | `AppRouteInput` from ts-rest-hono | ts-rest-hono already infers correct types from contract |
| Response validation | Manual Zod parsing | `responseValidation: true` option | Built-in, consistent with contract, catches handler bugs |
| Request validation | Custom middleware | ts-rest-hono built-in | Already validates against contract Zod schemas |

## Remaining Files Requiring Migration

### Route Files with Violations

| File | Contract | `as any` Count | Has `responseValidation` | Handler Pattern |
|------|----------|----------------|-------------------------|-----------------|
| **awards.ts** | awardContract | 1 | No | Inline |
| **entities.ts** | entityContract | 2 | No | Inline |
| **judges.ts** | judgeContract | 8 | No | Inline |
| **locations.ts** | locationContract | 1 | No | Inline |
| **posts.ts** | postContract | 4 | No | Inline (`postTsRestRouterObj: any`) |
| **tasks.ts** | taskContract | 1 | No | Inline |
| **tba.ts** | tbaContract | 1 | No | Inline |
| **users.ts** | userContract | 4 | No | Inline (`userTsRestRouter: any`) |
| **zulip.ts** | zulipContract | 6 | No | Inline |
| **inquiries/index.ts** | inquiryContract | 0 | No | Handler module |
| **outreach/index.ts** | outreachContract | 0 | No | Handler module |
| **media/index.ts** | mediaContract | 0 | No | Handler module |

### Handler Module Files

| Module | Handler File | `as any` Count | Notes |
|--------|--------------|----------------|-------|
| **inquiries** | inquiries/handlers.ts | 2 | `inquiryHandlers: any`, `input: any` |
| **outreach** | outreach/handlers.ts | 1 | `outreachHandlers: any` |
| **media** | media/handlers.ts | 0 | Already clean, needs response validation |

### Files Already Migrated (Phase 29)

analytics.ts, badges.ts, comments.ts, communications.ts, docs.ts, events/index.ts, finance.ts, github.ts, logistics.ts, notifications.ts, points.ts, profiles.ts, seasons.ts, settings.ts, sponsors.ts, store.ts (16 files total)

### Special Cases

| File | Contract | Status | Notes |
|------|----------|--------|-------|
| **zulipWebhook.ts** | None | No contract | Webhook endpoint, not a REST API route |
| **ai/index.ts** | aiContract | Mixed | Some endpoints use ts-rest, others are raw Hono |
| **simulations.ts** | None | No contract | SSE streaming endpoint, not standard REST |
| **socialQueue.ts** | socialQueueContract | Unknown | Needs verification |
| **sitemap.ts** | None | No contract | XML sitemap generator |

## Common Pitfalls

### Pitfall 1: Handler Module Type Casting
**What goes wrong:** Handler modules use `: any` on the exported handlers object, preventing type inference
**Why it happens:** Handler modules are separate files from router setup; developers add `: any` to fix type errors
**How to avoid:** Remove type annotations from handler exports, let ts-rest-hono infer from contract

### Pitfall 2: `Context<AppEnv>` in Handler Parameters
**What goes wrong:** Explicit `Context<AppEnv>` parameter prevents inference of `c` type
**Why it happens:** Developers think explicit types are clearer
**How to avoid:** Use `(input, c)` without type annotations; types are inferred from `initServer<AppEnv>()`

### Pitfall 3: Manual Input Type Annotations
**What goes wrong:** `{ body }: { body: MyBody }` doesn't match contract exactly
**Why it happens:** Developer defines types manually instead of using contract inference
**How to avoid:** Use `input` parameter and destructure `input.body`, `input.query`, `input.params`

### Pitfall 4: Response Validation Not Enabled
**What goes wrong:** Handlers can return data that doesn't match contract
**Why it happens:** `responseValidation: true` option not passed to `createHonoEndpoints`
**How to avoid:** Always enable response validation with error handler

## Code Examples

### Inline Handler Migration (judges.ts, posts.ts, etc.)

**BEFORE:**
```typescript
// functions/api/routes/judges.ts
const judgesTsRestRouter: any = s.router(judgeContract as any, {
  login: async ({ body }: { body: any }, c: Context<AppEnv>) => {
    const { code, turnstileToken } = body;
    // ...
  }
});
createHonoEndpoints(judgeContract, judgesTsRestRouter, judgesRouter);
```

**AFTER:**
```typescript
// functions/api/routes/judges.ts
import type { AppRouteInput } from "../../../shared/types/contracts";

const judgesTsRestRouter = s.router(judgeContract, {
  login: async (input, c) => {
    const { code, turnstileToken } = input.body;
    // ...
  }
});
createHonoEndpoints(
  judgeContract,
  judgesTsRestRouter,
  judgesRouter,
  {
    responseValidation: true,
    responseValidationErrorHandler: (err, c) => {
      console.error('[Contract] Response validation failed:', err.cause);
      return { error: { message: 'Internal server error' }, status: 500 };
    }
  }
);
```

### Handler Module Migration (inquiries/, outreach/, media/)

**BEFORE:**
```typescript
// handlers.ts
export const inquiryHandlers: any = {
  list: async (input: any, c: any) => {
    const { query } = input;
    // ...
  }
};

// index.ts
const inquiriesTsRestRouter = s.router(inquiryContract, inquiryHandlers);
createHonoEndpoints(inquiryContract, inquiriesTsRestRouter, inquiriesRouter);
```

**AFTER:**
```typescript
// handlers.ts
export const inquiryHandlers = {
  list: async (input, c) => {
    const { limit, offset } = input.query;
    // ...
  }
};

// index.ts
const inquiriesTsRestRouter = s.router(inquiryContract, inquiryHandlers);
createHonoEndpoints(
  inquiryContract,
  inquiriesTsRestRouter,
  inquiriesRouter,
  {
    responseValidation: true,
    responseValidationErrorHandler: (err, c) => {
      console.error('[Contract] Response validation failed:', err.cause);
      return { error: { message: 'Internal server error' }, status: 500 };
    }
  }
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `as any` cast on handlers | Inferred `AppRouteInput` types | Phase 29 (2026-05-05) | Full type safety from contract to handler |
| No runtime validation | `responseValidation: true` | Phase 29 (2026-05-05) | Catches handler bugs at API boundary |
| Manual type annotations | Contract inference | Phase 29 (2026-05-05) | Reduces boilerplate, prevents drift |

**Deprecated/outdated:**
- `ContractHandler<T>` type from `shared/types/contracts.ts`: Use `AppRouteImplementation` from ts-rest-hono
- `HandlerInput<T>` type: Use `AppRouteInput` from `shared/types/contracts.ts`

## Open Questions

1. **Handler module file organization**
   - What we know: inquiries/, outreach/, media/ use separate handlers.ts files
   - What's unclear: Should handlers.ts be merged into index.ts for consistency?
   - Recommendation: Keep handler modules for complex routes, migrate types as-is

2. **ai/index.ts partial ts-rest usage**
   - What we know: Some AI endpoints don't use ts-rest (e.g., /liveblocks-copilot, /status)
   - What's unclear: Should all AI endpoints be migrated to ts-rest?
   - Recommendation: Skip non-REST endpoints (SSE, webhooks) in this phase

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| ts-rest-hono | Contract inference | Yes | 0.5.0 | — |
| @ts-rest/core | Contract definitions | Yes | 3.52.1 | — |
| zod | Runtime validation | Yes | 4.4.3 | — |

**Missing dependencies with no fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | vitest.config.ts |
| Quick run command | `npm test -- --run functions/api/routes/[file].test.ts` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map

All route files have existing test files. Contract inference migration should not break existing tests because:

1. Route handlers maintain the same external API (HTTP endpoints)
2. Contract types remain unchanged
3. Response validation only affects handler return values, not test behavior

### Wave 0 Gaps

None — existing test infrastructure covers all phase requirements. Tests verify behavior at HTTP level, which is unchanged by type system improvements.

### Sampling Rate
- **Per task commit:** Run tests for the specific route file being migrated
- **Per wave merge:** Full test suite
- **Phase gate:** Full suite green before `/gsd-verify-work`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Partial | Covered by auth.ts (not in this phase) |
| V3 Session Management | Partial | Covered by auth.ts (not in this phase) |
| V4 Access Control | Yes | ensureAdmin, ensureAuth middleware (existing) |
| V5 Input Validation | Yes | Zod schemas in ts-rest contracts + runtime validation |
| V6 Cryptography | Yes | Existing encryption/decryption (unchanged) |

### Known Threat Patterns for ts-rest routes

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection | Tampering | Kysely parameterized queries (existing) |
| Response data leakage | Information Disclosure | responseValidation: true (NEW) |
| Type confusion attacks | Tampering | Zod runtime validation (existing, now enforced) |

## Sources

### Primary (HIGH confidence)
- Phase 29-01-SUMMARY.md - Contract inference pattern documentation
- Phase 29-02-SUMMARY.md - Batch migration of 14 route files
- shared/types/contracts.ts - Type exports (AppRouteInput, AppRouteImplementation)
- Codebase grep analysis - Verified all `as any` patterns

### Secondary (MEDIUM confidence)
- ts-rest-hono documentation - Contract inference patterns
- Phase 29 PLAN files - Migration strategy

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified via npm registry
- Architecture: HIGH - Pattern proven in Phase 29, verified via code analysis
- Pitfalls: HIGH - All patterns identified via codebase grep
- Remaining files count: HIGH - Verified via grep for `as any` and `responseValidation`

**Research date:** 2026-05-05
**Valid until:** 30 days (stable phase, patterns well-established)
