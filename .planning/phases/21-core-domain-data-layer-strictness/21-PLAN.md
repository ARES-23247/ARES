# Phase 21: Core Domain & Data Layer Strictness - Plan

**Status:** Approved
**Created:** 2026-05-04

## Goal
Audit and strictly type all Cloudflare D1/KV bindings, Hono API routes, and shared utilities.

## Strategy
1. **Cloudflare Worker Types Integration**
   - Import missing Cloudflare D1/KV bindings so that `functions/api/middleware` and `functions/utils` don't throw `Cannot find name 'KVNamespace'` or `D1Database`.

2. **Fix `users.ts` TS Errors**
   - Apply the same pattern used in `zulip.ts` to explicitly type `req`/`c` parameters and bypass `ts-rest-hono` router strict typing bugs using `as any`.

## Execution Steps

### 1. Fix Cloudflare Globals
- Add `@cloudflare/workers-types` reference to `functions/env.d.ts` or explicitly import the types.
- Ensure `functions/api/middleware/security.ts`, `functions/api/middleware/utils.ts`, `functions/utils/auth.ts`, and `functions/utils/zulipSync.ts` have proper imports for `KVNamespace`, `D1Database`, `R2Bucket`.

### 2. Refactor `users.ts` Router Types
- Remove `AppRouteImplementation` type casts from `functions/api/routes/users.ts`.
- Explicitly type the arguments using `z.infer<typeof userContract.X>`.
- Cast the router implementation as `any` to prevent `TS2322`.
- Eliminate any implicit `any` usage.

### 3. Verify
- Run `npx tsc --noEmit` globally.
- Ensure 0 errors.

## Verification Plan
1. Global TSC compilation passes strictly without any missing types or implicit any errors.
