# Phase 10: Usage Metrics Dashboard - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Build an administrative dashboard interface to track and visualize platform usage metrics, such as daily active users and API latency.

</domain>

<decisions>
## Implementation Decisions

### Data Source
- **D-01:** Use Custom D1 Tracking.
- **D-02:** Build a lightweight Hono middleware to log API latency and page hits asynchronously into a new D1 SQLite `metrics` table. This avoids 3rd-party dependencies and allows tying usage to specific user roles via `better-auth`.

### Visualization Library
- **D-03:** Use Recharts.
- **D-04:** Leverage Recharts' React-native declarative components to style charts using existing Tailwind CSS variables, ensuring responsive resizing and dark/light theme compatibility.

### Metrics Scope & Display
- **D-05:** Track and visualize:
  - Daily Active Users (DAU) over the last 30 days.
  - Total API requests per day.
  - Average API latency (ms).
  - Top endpoints (most visited routes).
  - Tasks completed per day.
  - Posts viewed.

### the agent's Discretion
- Database schema structure for the new `metrics` table (e.g., aggregation strategies vs raw logs).
- Precise layout of the charts within the Admin dashboard.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Dashboard UI & Auth
- `.agents/skills/aresweb-brand-enforcement/SKILL.md` — To ensure Recharts colors match ARES 23247 FIRST Robotics core brand palettes.
- `src/components/AdminSidebar.tsx` (assumed path) — To add the new Metrics tab under Admin gated routes.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Hono middleware patterns in `functions/api/index.ts` can serve as a template for the asynchronous metrics logger.

### Established Patterns
- All database migrations use standard D1 SQL schema scripts. A new migration will be needed for the metrics tables.

</code_context>

<specifics>
## Specific Ideas

- Ensure Recharts components scale properly inside the responsive Tailwind grid.
- Keep the D1 logging middleware asynchronous so it does not block the actual API response to the user.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-Usage Metrics Dashboard*
*Context gathered: 2026-05-04*
