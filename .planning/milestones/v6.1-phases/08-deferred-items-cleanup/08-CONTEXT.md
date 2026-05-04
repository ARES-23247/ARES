# Phase 08: Deferred Items Cleanup - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning
**Source:** PRD Express Path (.planning/REQUIREMENTS.md)

## Phase Boundary

This phase addresses deferred items from prior milestones that were not completed:
- **DEF-01:** Media manager E2E testing (from v5.7)
- **DEF-02:** Usage metrics admin dashboard (from v5.7)
- **INV-01:** Zulip account sync investigation (from v6.0)

## Implementation Decisions

### Testing (DEF-01)
- **Locked:** Media manager E2E tests must cover upload, delete, and gallery view operations
- **Locked:** Tests should use Playwright to match existing E2E patterns (tests/e2e/*.spec.ts)
- **Locked:** API mocking for media endpoints following existing patterns (kanban.spec.ts, collaboration.spec.ts)

### Admin Dashboard (DEF-02)
- **Locked:** Create admin dashboard for viewing usage metrics
- **Locked:** Metrics should include page views, user activity, resource usage
- **Locked:** Dashboard should be accessible only to admin users
- **Locked:** Use existing analytics data from D1/analytics routes

### Zulip Integration (INV-01)
- **Locked:** Investigate Zulip account sync between aresfirst.org and Zulip
- **Locked:** Verify all team members have linked accounts
- **Locked:** Document any gaps in the sync process
- **Locked:** Create fix plan if sync issues found

### Claude's Discretion
- Test structure and organization (describe tests, not how to structure files)
- Dashboard UI layout and component hierarchy
- Visual design (use existing ARES brand patterns)
- Specific Zulip API endpoints to investigate
- Priority order for the three items

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### E2E Testing Patterns
- `tests/e2e/collaboration.spec.ts` — Playwright multi-user testing pattern
- `tests/e2e/kanban.spec.ts` — API mocking and authentication patterns

### Admin UI Patterns
- `src/components/admin/` — Existing admin components
- `src/components/dashboard/` — Dashboard layout patterns

### Analytics
- `functions/api/routes/analytics.ts` — Analytics data sources

### ARES Brand
- `.agents/skills/aresweb-brand-enforcement/SKILL.md` — ARES color palette and typography
- `.agents/skills/aresweb-web-accessibility/SKILL.md` — WCAG 2.1 AA requirements

### Zulip Integration
- `src/lib/zulip/` — Existing Zulip integration code

## Specific Ideas

### Media Manager E2E Tests
Test scenarios:
- Upload image via media manager
- Delete image from media manager
- View media gallery
- Filter/search media

### Usage Metrics Dashboard
Data sources:
- D1 analytics tables
- API route: `/api/admin/analytics`

### Zulip Account Sync
Investigation areas:
- User sync between aresfirst.org and Zulip
- Team member roster comparison
- Authentication flow

## Deferred Ideas

- Advanced analytics (time-series charts, export)
- Media manager performance tests (large files)
- Automated Zulip sync fixes

---

*Phase: 08-deferred-items-cleanup*
*Context gathered: 2026-05-04 via PRD Express Path*
