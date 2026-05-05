# Phase 21: Core Domain & Data Layer Strictness - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit and strictly type all Cloudflare D1/KV bindings, Hono API routes, and shared utilities.

</domain>

<decisions>
## Implementation Decisions

### Hono API Routes
- Type inference bypass for `ts-rest-hono` via explicit parameters + `as any` casting to resolve TS2322 without losing developer type-safety. (Completed for `zulip.ts`).
- `users.ts` route handlers must use similar pattern if they fail TS2322.

### Cloudflare Bindings
- Import missing `@cloudflare/workers-types` or define global globals (like `D1Database`, `KVNamespace`) so that references in `functions/api/middleware/security.ts`, `functions/api/middleware/utils.ts`, and `functions/utils/auth.ts` compile securely without `any` fallbacks.

### the agent's Discretion
- Exactly how to inject Cloudflare types (e.g., via `env.d.ts` or `tsconfig.json`).

</decisions>

<canonical_refs>
## Canonical References

### Dependencies
- `@ts-rest/core` bug with `zod@4` — necessitates the router implementation bypass

### Project Constraints
- Must pass `npx tsc --noEmit` globally.

</canonical_refs>

<specifics>
## Specific Ideas

- Ensure `D1Database`, `KVNamespace`, and `R2Bucket` types are available in `functions/api/middleware` and `functions/utils`.
- Clean up implicit `any` in `functions/api/routes/users.ts`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-core-domain-data-layer-strictness*
*Context gathered: 2026-05-04*
