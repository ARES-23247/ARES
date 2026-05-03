# Milestone v5.7 Requirements

**Archived:** (Not yet)
**Status:** In Progress

## Requirements

### Performance (PERF)
- [ ] **PERF-01**: Implement lazy loading for major application routes to reduce initial bundle size.
- [ ] **PERF-02**: Apply code splitting to large dependencies (Monaco Editor, TipTap, Babel, Media tools) to ensure no single chunk exceeds 1MB.
- [ ] **PERF-03**: Integrate a bundle analyzer tool into the build pipeline to prevent future regressions.

### Testing (TEST)
- [ ] **TEST-01**: Add Playwright E2E tests covering the new "Repair Calendar" flow in the Admin Dashboard.
- [ ] **TEST-02**: Add Playwright E2E tests for the Zulip Auditor and User auto-invitation workflows.
- [ ] **TEST-03**: Add Playwright E2E tests for the media manager upload and deletion workflows (R2).
- [ ] **TEST-04**: Achieve 100% unit test coverage for `repairCalendar` and `auditMissingUsers` API handlers.

### Feature Expansion (FEAT)
- [ ] **FEAT-01**: Implement GCal synchronization for recurring event series (pushing the full series, not just the first instance).
- [ ] **FEAT-02**: Enhance the admin dashboard with improved table sorting and pagination for user management.

### Analytics & Monitoring (MON)
- [ ] **MON-01**: Integrate an error tracking solution (e.g., Sentry) to catch and log unhandled exceptions on both the frontend and backend.
- [ ] **MON-02**: Add API latency logging middleware to track the performance of core endpoints.
- [ ] **MON-03**: Build a basic usage metrics dashboard in the Admin console to visualize active users and API load.

## Future Requirements
- Advanced synthetic monitoring.
- Real-time performance profiling in the UI.

## Out of Scope
- Full APM (Application Performance Monitoring) solutions like Datadog (too complex for current needs).
- Native mobile app optimizations.

## Traceability
*(To be populated by the roadmapper)*
