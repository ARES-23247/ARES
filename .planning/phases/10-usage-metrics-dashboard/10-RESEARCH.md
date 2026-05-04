# Phase 10: Usage Metrics Dashboard - Research

## Context

The goal is to build an administrative dashboard that visualizes usage metrics (DAU, API traffic, latency, etc.). The agreed approach is to use custom D1 tracking (middleware writing to a new D1 SQLite table) and Recharts for visualization on the React frontend.

## Database Schema (D1)

We need a new table to store API request telemetry. Because ARESWEB is a low-traffic robotics portal, inserting a row per API request is viable under Cloudflare's D1 free limits (100k writes/day).

**Proposed Table: `usage_metrics`**
- `id` (TEXT PRIMARY KEY) - UUID
- `timestamp` (DATETIME DEFAULT CURRENT_TIMESTAMP)
- `endpoint` (TEXT) - e.g., `/api/posts`, `/api/auth/session`
- `method` (TEXT) - `GET`, `POST`
- `latency_ms` (INTEGER)
- `status_code` (INTEGER)
- `user_id` (TEXT NULL) - To calculate Daily Active Users (DAU)

**Migration strategy:**
Add `migrations/053_add_usage_metrics.sql` and run `npm run migrate:local` / `migrate:prod`. This will auto-update `shared/schemas/database.ts` via `kysely-codegen`.

## API Middleware

The `functions/api/[[route]].ts` file mounts middleware. We should inject an asynchronous logging middleware early in the chain.

```typescript
// Example Middleware
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const latency = Date.now() - start;
  
  // Only log /api routes to avoid static asset noise
  if (c.req.path.startsWith("/api/") && !c.req.path.includes("polling")) {
    const userId = c.get("user")?.id || null;
    // Asynchronous D1 insertion using executionCtx.waitUntil
    c.executionCtx.waitUntil(
      c.env.DB.prepare(
        "INSERT INTO usage_metrics (id, endpoint, method, status_code, latency_ms, user_id) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .bind(crypto.randomUUID(), c.req.path, c.req.method, c.res.status, latency, userId)
      .run()
    );
  }
});
```

*Note on `c.executionCtx.waitUntil`: This ensures the DB insert doesn't block the HTTP response sent back to the client!*

## API Endpoint for Dashboard

We need a new admin-only route to aggregate this data:
- `GET /api/analytics/metrics`
- It will query D1 and aggregate data (e.g., DAU over 30 days, avg latency per route, top endpoints).
- Use Kysely's `sql` helper to group by `DATE(timestamp)`.

## Frontend (Recharts)

- Run `npm install recharts`.
- Create a new dashboard page at `src/pages/admin/MetricsDashboard.tsx`.
- Add the route to `src/App.tsx` and `AdminSidebar.tsx`.
- Build declarative charts: `<LineChart>`, `<BarChart>`.
- Use Tailwind classes or CSS variables for colors (e.g., `stroke="var(--color-primary)"`).

## Conclusion & Risks

- **Risk:** Database storage limits. D1 allows 500MB free. Logging every request will grow over time.
- **Mitigation:** We can either log only mutations, or add a simple CRON job to delete logs older than 30 days. For now, since we only need "last 30 days" DAU, a 30-day retention policy is perfect.

RESEARCH COMPLETE.
