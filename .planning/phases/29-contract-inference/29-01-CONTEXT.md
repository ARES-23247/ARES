# Phase 29: Contract Inference - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Lock in type safety at API boundaries using ts-rest contract inference and Zod runtime validation. Eliminate `as any` casts from router setup, ensure Zod validators run at API boundaries, and export contract types for frontend consumption.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Follow ts-rest best practices for contract inference and established patterns from Phase 28 handler type fixes.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `shared/types/api.ts` — HandlerInput, HonoContext types from Phase 27
- `shared/types/database.ts` — D1Row, SelectableRow, InsertableRow types
- `shared/schemas/contracts/*.ts` — 33 ts-rest contracts with Zod schemas already defined

### Established Patterns
- Phase 28 established HandlerInput/HonoContext pattern for route handlers
- Contracts use Zod schemas for request/response validation
- Router setup currently uses `as any` cast to work around ts-rest type inference

### Integration Points
- 15+ route files in `functions/api/routes/` need router setup fixes
- Frontend consumes contract types via `shared/schemas/contracts/index.ts`

</code_context>

<specifics>
## Specific Ideas

**Key observation:** ts-rest contracts already exist with Zod schemas. The issue is handler return types don't match contract expectations due to union types (SuccessResponse | ErrorResponse). Need to either:
1. Fix handler signatures to match contract types exactly
2. Use ts-rest's `initServer<AppEnv>` for proper inference
3. Add runtime Zod validation middleware

Current `as any` locations (from grep):
- analytics.ts, badges.ts, comments.ts, communications.ts, docs.ts
- events/index.ts, finance.ts, github.ts, logistics.ts, notifications.ts
- points.ts, profiles.ts, seasons.ts, settings.ts, sponsors.ts, store.ts

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase focused on type safety completion.

</deferred>
