# Phase 24: ESLint Lockdown & CI Validation — Assessment

**Date:** 2026-05-05
**Status:** Deferred — requires multi-session chunked execution

## Assessment

### Current State
- **`npx tsc --noEmit`**: ✅ 0 errors — the codebase compiles cleanly
- **`@typescript-eslint/no-explicit-any`**: ❌ 983 violations across 73 files
- **All 983 violations** are in `functions/api/routes/` (backend Hono API layer)

### Top Offenders (by file)
| Count | File |
|-------|------|
| 77 | `functions/api/routes/events/handlers.ts` |
| 51 | `functions/api/routes/docs.ts` |
| 39 | `functions/api/routes/tasks.test.ts` |
| 33 | `functions/api/routes/comments.ts` |
| 31 | `functions/api/routes/sponsors.ts` |
| 30 | `functions/api/routes/_profileUtils.ts` |
| 30 | `functions/api/routes/inquiries.test.ts` |
| 30 | `functions/api/routes/media.test.ts` |
| 28 | `functions/api/routes/notifications.ts` |
| 26 | `functions/api/routes/communications.test.ts` |

### Categories of `any` Usage
1. **D1 query results** — `db.prepare().all()` returns `Record<string, any>` rows
2. **Hono context bindings** — `c.env.DB`, `c.var`, request body types
3. **Test mocks** — mock objects for D1, KV, and request contexts
4. **External API responses** — Zulip, TBA, GitHub, Cloudflare API payloads
5. **JSON parsing** — `JSON.parse()` return values used without narrowing

### Why This Can't Be Done In One Pass
The plan itself warned: *"Blindly replacing `any` with `unknown` results in ~2500 TS compilation errors."* Each `any` requires understanding the domain type, creating or reusing an interface, and validating the narrowing doesn't break runtime behavior. At 983 instances, this is approximately 15-20 hours of mechanical refactoring.

### Recommended Approach for Future Sessions
1. **Chunk by file** — tackle 3-5 files per session, starting with the highest-count files
2. **Create shared D1 row types** — a `types/d1.ts` with `D1Result<T>` generic would eliminate ~40% of violations
3. **Create Hono env bindings** — a proper `HonoEnv` type for `Env` bindings would eliminate another ~20%
4. **Test mocks last** — test files can use `as unknown as T` patterns more liberally

## Verification
- `npx tsc --noEmit`: ✅ 0 errors
- `npm run lint` (current rules): ✅ 0 errors (rule is `warn`, not `error`)
- `npm run build`: ✅ Passes
