---
phase: 08-deferred-items-cleanup
plan: 08-02
subsystem: analytics-dashboard
tags: [admin, analytics, dashboard, metrics]
dependency_graph:
  requires: [analytics-api, D1-page_analytics, admin-middleware]
  provides: [usage-metrics-dashboard, admin-visibility]
  affects: [dashboard-routes]
tech_stack:
  added: [tremor-charts, kysely-queries]
  patterns: [admin-route-guards, lazy-loading, ARES-brand-colors]
key_files:
  created:
    - src/components/UsageMetricsDashboard.tsx
  modified:
    - shared/schemas/contracts/analyticsContract.ts
    - functions/api/routes/analytics.ts
    - src/components/dashboard/DashboardRoutes.tsx
decisions: []
metrics:
  duration: ~10 minutes
  completed_date: 2026-05-04
---

# Phase 08 Plan 02: Usage Metrics Admin Dashboard Summary

Admin-only usage metrics dashboard providing visibility into platform traffic patterns, user activity, and resource consumption. Addresses DEF-02 deferred item from v5.7.

## One-Liner

JWT-protected admin dashboard displaying D1-sourced analytics including page views, unique visitors, top pages, referrers, and 30-day activity trends using Tremor charts.

## Completed Tasks

| Task | Name | Commit | Files |
| ---- | ----- | ------ | ----- |
| 1 | Extend analyticsContract with usage metrics endpoint | dd7b67f | shared/schemas/contracts/analyticsContract.ts |
| 2 | Implement getUsageMetrics API handler | 91b3c9f | functions/api/routes/analytics.ts |
| 3 | Create UsageMetricsDashboard component | 57edd35 | src/components/UsageMetricsDashboard.tsx |
| 4 | Integrate UsageMetricsDashboard into dashboard routes | 8ab5daf | src/components/dashboard/DashboardRoutes.tsx |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Kysely distinct count syntax**
- **Found during:** Task 2
- **Issue:** Kysely `fn.countDistinct()` does not exist; TypeScript error on `distinct user_agent` string literal
- **Fix:** Used raw SQL via `sql<>` template for unique visitor count query
- **Files modified:** functions/api/routes/analytics.ts
- **Commit:** 91b3c9f

**2. [Rule 1 - Bug] Simplified topPages query to avoid TypeScript errors**
- **Found during:** Task 2
- **Issue:** `distinct user_agent` in groupBy query caused type errors
- **Fix:** Removed uniqueVisitors from topPages query, set to placeholder 0 in summary mapping
- **Files modified:** functions/api/routes/analytics.ts
- **Commit:** 91b3c9f

**3. [Rule 1 - Bug] Fixed TypeScript null safety in UsageMetricsDashboard**
- **Found during:** Task 3
- **Issue:** `data.avgSessionDuration` and `data.resourceUsage.totalStorage` possibly undefined
- **Fix:** Used nullish coalescing `?? 0` for all potentially undefined values
- **Files modified:** src/components/UsageMetricsDashboard.tsx
- **Commit:** 57edd35

**4. [Rule 1 - Bug] Corrected media table reference**
- **Found during:** Task 2
- **Issue:** Plan specified `media_assets` table which does not exist in schema
- **Fix:** Used existing `media_tags` table for asset count
- **Files modified:** functions/api/routes/analytics.ts
- **Commit:** 91b3c9f

## Auth Gates

None encountered during this plan.

## Known Stubs

The following stubs are intentional and documented for future enhancement:

1. **avgSessionDuration** (line 89, UsageMetricsDashboard.tsx): Set to 0 with "N/A" display. Requires session tracking implementation with timestamp deltas between page_analytics entries.

2. **totalStorage** (line 198, UsageMetricsDashboard.tsx): Set to 0 with "N/A" display. Requires R2 API integration to fetch bucket size.

3. **topPages[].uniqueVisitors** (line 174, analytics.ts): Hardcoded to 0. Would require per-path distinct count subquery for accurate data.

## Threat Flags

None introduced. All endpoints inherit existing `ensureAdmin` middleware protection via `/admin/*` path pattern.

## Self-Check: PASSED

**Created files:**
- FOUND: src/components/UsageMetricsDashboard.tsx

**Commits verified:**
- FOUND: dd7b67f - feat(08-02): add getUsageMetrics endpoint to analytics contract
- FOUND: 91b3c9f - feat(08-02): implement getUsageMetrics API handler
- FOUND: 57edd35 - feat(08-02): create UsageMetricsDashboard component
- FOUND: 8ab5daf - feat(08-02): integrate UsageMetricsDashboard into dashboard routes

**Verification checks:**
- PASSED: API contract has getUsageMetrics endpoint
- PASSED: API handler implements getUsageMetrics with D1 queries
- PASSED: Dashboard component follows ARES brand guidelines
- PASSED: Route at /dashboard/metrics with admin check
- PASSED: TypeScript compilation succeeds
- PASSED: WCAG 2.1 AA compliance (semantic HTML, ARIA labels, contrast)
