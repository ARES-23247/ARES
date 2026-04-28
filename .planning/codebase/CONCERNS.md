---
mapped_date: 2026-04-28
---
# Areas of Concern & Tech Debt

## Test Flakiness
- **`waitUntil` behavior:** Asynchronous execution inside `c.executionCtx.waitUntil()` can cause race conditions or unhandled promise rejections in the Vitest environment if the test exits before the microtask queue clears. Tests often rely on `setTimeout(resolve, 10)` as a workaround.

## Database Mocks
- **Kysely Expression Builders:** Mocking complex Kysely SQL functions (like `eb.fn.sum()`) requires precise `mockImplementation` logic to ensure callbacks are executed, which has historically caused coverage gaps.

## Media Uploads
- Magic byte validation for PNG uploads (`89504e47`) requires careful `ArrayBuffer` slicing to prevent malformed headers.

## Cloudflare D1 Constraints
- Local testing relies on `wrangler d1 execute`, and SQLite limits apply.
