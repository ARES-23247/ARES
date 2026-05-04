---
wave: 1
depends_on: []
files_modified: []
autonomous: false
---

# Phase 10: Usage Metrics Dashboard - Execution Plan

## Verification Criteria
- [ ] Dimension 1: `usage_metrics` table exists in D1 and `shared/schemas/database.ts`.
- [ ] Dimension 2: `functions/api/[[route]].ts` injects background logging for metrics.
- [ ] Dimension 3: `GET /api/analytics/metrics` endpoint exists and returns aggregated metrics.
- [ ] Dimension 4: `MetricsDashboard.tsx` renders Recharts for DAU, Latency, and Traffic without type errors.

## Tasks

### 1. Database Migration
- **Status:** [ ] Not started
- **Requirements:** MON-01, MON-02
- **Description:** Create a D1 schema migration for the `usage_metrics` table.
- <action>
  Create `migrations/053_add_usage_metrics.sql` with table definition. Run `npm run migrate:local` to generate Kysely types.
  </action>

### 2. Backend Middleware & Endpoint
- **Status:** [ ] Not started
- **Requirements:** MON-01, MON-02
- **Description:** Add the asynchronous latency logging middleware to `[[route]].ts` and create the analytics route to serve aggregated metrics to the frontend.
- <action>
  1. Modify `functions/api/[[route]].ts` to track latency and `waitUntil` insert.
  2. Create `functions/api/routes/analytics.ts` with `ensureAdmin`.
  3. Mount the new router.
  </action>

### 3. Frontend Recharts Dashboard
- **Status:** [ ] Not started
- **Requirements:** MON-01, MON-02
- **Description:** Install Recharts and build the admin metrics dashboard UI.
- <action>
  1. `npm install recharts`.
  2. Create `src/pages/admin/MetricsDashboard.tsx`.
  3. Add `<LineChart>` and `<BarChart>` components.
  4. Mount it to `App.tsx` and `AdminSidebar.tsx`.
  </action>

## Verification
- [ ] Build passes (`npx tsc --noEmit`)
- [ ] Dashboard route successfully fetches and renders metrics locally.
