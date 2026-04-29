# Requirements

**Coverage:** 8 / 8 requirements satisfied

| REQ-ID | Description | Phase | Status |
|--------|-------------|-------|--------|
| REQ-1 | Resolve Migration 048 Database Error | 24 | [x] |
| REQ-2 | Simplify and Audit Database | 25 | [x] |
| REQ-3 | Refactor remaining raw SQL to Kysely | 26 | [x] |
| REQ-4 | Move isolate-memory rate limiting to KV | 27 | [x] |
| REQ-5 | Implement D1 edge caching | 28 | [x] |
| REQ-6 | Garbage collect soft-deleted rows | 28 | [x] |
| REQ-7 | CI Pipeline Optimization | 28 | [x] |
| REQ-8 | E2E Suite Sharding | 28 | [x] |

## Detailed Requirements

### [x] REQ-1: Resolve Migration 048 Database Error
The database migration `048_liveblocks_state_persistence.sql` fails with a `duplicate column name: content_draft` SQLite error.
- **[x] AC-1**: Ensure the migration completes successfully on local and remote Cloudflare D1 without throwing a duplicate column error.

### [x] REQ-2: Simplify and Audit Database
The database contains 49 migration files. It needs simplification and an audit to ensure schema integrity.
- **[x] AC-1**: Evaluate current migrations and identify obsolete tables or excessive indexing.
- **[x] AC-2**: Perform a simplification where possible (e.g. coalescing early migrations or dropping deprecated columns) and produce an audit log.

### [x] REQ-3: Refactor Raw SQL to Kysely
Refactor remaining raw SQL in `media/handlers.ts` and `middleware/auth.ts` to Kysely to guarantee type-safety.

### [x] REQ-4: Move isolate-memory rate limiting to KV
Move isolate-memory rate limiting to KV or WAF for global synchronization.

### [x] REQ-5: Implement D1 edge caching
Implement D1 edge caching for read-heavy routes to reduce database operations.

### [x] REQ-6: Garbage collect soft-deleted rows
Implement a Cloudflare Scheduled Worker (Cron) to garbage-collect soft-deleted database rows.

### [x] REQ-7: CI Pipeline Optimization
Restructure CI workflow to run checks and tests in parallel and isolate preview deployments.

### [x] REQ-8: E2E Suite Sharding
Shard Playwright E2E tests into a parallel matrix and decouple Pa11y tests.
