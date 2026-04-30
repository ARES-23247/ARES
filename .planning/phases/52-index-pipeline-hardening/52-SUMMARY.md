---
phase: 52
name: Index Pipeline Hardening
status: completed
requirements_completed: [TD-03, TD-04, TD-05]
files_changed:
  - migrations/0004_add_updated_at.sql
  - shared/schemas/database.ts
  - functions/api/routes/events/handlers.ts
  - functions/api/routes/posts.ts
  - functions/api/routes/ai/indexer.ts
  - functions/api/routes/ai/index.ts
  - functions/api/routes/ai/reindex.test.ts
  - functions/api/[[route]].ts
---

# Phase 52 Summary: Index Pipeline Hardening

## TD-03: Database Schema — `updated_at` Columns
- Created migration `0004_add_updated_at.sql` adding `updated_at TEXT` to `events` and `posts`.
- Backfilled 50 existing rows using `COALESCE(published_at, datetime('now'))`.
- Updated TypeScript schema (`database.ts`) with `updated_at: Generated<string | null>`.
- Added `updated_at: new Date().toISOString()` to all mutation `.set()` calls (4 in events handlers, 4 in posts).
- Updated `indexer.ts` to use incremental `WHERE updated_at > lastIndexed` for all 4 content types (events, posts, docs, seasons).

## TD-04: Rate Limiting on Admin Reindex
- Added `persistentRateLimitMiddleware(5, 600)` (5 req / 10 min) to `POST /reindex` endpoint in `ai/index.ts`.
- Updated `reindex.test.ts` mock to include the new middleware export.

## TD-05: Cron Heartbeat
- Added `cron_last_run` KV write at end of scheduled handler in `[[route]].ts`.
- Production cron execution can now be validated by reading `cron_last_run` from RATE_LIMITS KV.
