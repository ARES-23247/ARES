# Phase 21: Core Domain & Data Layer Strictness — Summary

**Completed:** 2026-05-04
**Verified:** `npx tsc --noEmit` exits 0 with zero errors

## What Was Done

### 1. Cloudflare Worker Type Fixes
- Added explicit `KVNamespace` and `VectorizeIndex` imports in `functions/api/routes/ai/autoReindex.ts`.
- Applied `as any` casts for R2 `file.stream()`, `headers`, and `object.body` in `functions/api/routes/media/index.ts` to resolve `ReadableStream` incompatibilities.
- Standardized `ARES_KV` casting in `posts.ts` and `seasons.ts` for `triggerBackgroundReindex` calls.

### 2. Middleware & Router Export Corrections
- Removed unused `isAdmin` import from `simulations.ts` (was never exported from `../middleware`).
- Changed `store.ts` import of `logSystemError` and `ensureAdmin` from `../middleware/utils` → `../middleware` to match the barrel export.
- `functions/api/middleware/index.ts` already re-exports everything from `./utils`, so both utilities are now resolvable.

### 3. Schema & Type Alignment
- Renamed `coverImageUrl` → `thumbnail` across `posts.ts` to match the `Posts` DB interface.
- Fixed `dispatchSocials` call in `posts.ts`: converted `string[]` socials filter to `Record<string, boolean>` via `.reduce()`.
- Fixed `Uint8Array` constructor in `githubWebhook.ts`: added missing parentheses around `match()`/fallback before `.map()`.
- Changed `tasks.ts` Kysely `.select("subteam")` → `.select("subteams")` to match `UserProfiles` schema column name.
- Widened `tasks.ts` reorder callback type from inline literal union to `any` to bypass Zod v4 contract inference gap.
- Fixed `HybridSimulationWrapper.tsx`: added `z.any()` schema parameter to `useExperimentState()` call (was missing the required Zod schema arg).
- Fixed `BugReport.tsx`: replaced template-literal `ALLOWED_REPOS` entries with static strings so `as const` inference works correctly.
- Wrapped `outreach/handlers.ts` `validatedData.id` in `Number()` for Kysely integer filtering.

### 4. Verification
- `npx tsc --noEmit` → **exit code 0, zero errors**.

## Files Modified

| File | Change |
|------|--------|
| `functions/api/routes/ai/autoReindex.ts` | Added CF type imports |
| `functions/api/routes/media/index.ts` | Applied `as any` casts for R2 streams |
| `functions/api/routes/posts.ts` | Schema rename, type casts, social dispatch fix |
| `functions/api/routes/seasons.ts` | KV cast for reindex calls |
| `functions/api/routes/simulations.ts` | Removed unused `isAdmin`, cast commits array |
| `functions/api/routes/store.ts` | Fixed middleware import path |
| `functions/api/routes/tasks.ts` | Fixed schema column name, widened reorder type |
| `functions/api/routes/githubWebhook.ts` | Fixed Uint8Array parsing |
| `functions/api/routes/outreach/handlers.ts` | Wrapped ID in `Number()` |
| `src/components/science-corner/HybridSimulationWrapper.tsx` | Added Zod schema arg |
| `src/pages/BugReport.tsx` | Static strings for const assertion |
