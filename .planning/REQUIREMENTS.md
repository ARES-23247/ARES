# Requirements

## [ ] REQ-1: Resolve Migration 048 Database Error
The database migration `048_liveblocks_state_persistence.sql` fails with a `duplicate column name: content_draft` SQLite error.
- **[ ] AC-1**: Ensure the migration completes successfully on local and remote Cloudflare D1 without throwing a duplicate column error.

## [ ] REQ-2: Simplify and Audit Database
The database contains 49 migration files. It needs simplification and an audit to ensure schema integrity.
- **[ ] AC-1**: Evaluate current migrations and identify obsolete tables or excessive indexing.
- **[ ] AC-2**: Perform a simplification where possible (e.g. coalescing early migrations or dropping deprecated columns) and produce an audit log.

## [ ] REQ-3: Refactor remaining raw SQL in `media/handlers.ts` and `middleware/auth.ts` to Kysely to guarantee type-safety.

## [ ] REQ-4: Move isolate-memory rate limiting to KV or WAF for global synchronization.

## [ ] REQ-5: Implement D1 edge caching for read-heavy routes to reduce database operations.

## [ ] REQ-6: Implement a Cloudflare Scheduled Worker (Cron) to garbage-collect soft-deleted database rows.
