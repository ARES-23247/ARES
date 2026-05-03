# Phase 7: Testing - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning
**Mode:** Auto-generated (Autonomous execution)

<domain>
## Phase Boundary

Write E2E tests using Playwright for Calendar (Repair endpoint), Zulip (Audit endpoint), and Media (Upload endpoint).
Write unit tests for the backend handlers to reach 100% coverage for these three features.
</domain>

<decisions>
## Implementation Decisions

### the agent's Discretion
Use existing Playwright scaffolding in `tests/e2e`. Create three new spec files: `calendar.spec.ts`, `zulip.spec.ts`, and `media.spec.ts`.
For unit tests, use Vitest in `functions/api/routes/__tests__`.
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Playwright config in `playwright.config.ts`
- Vitest config in `vite.config.ts`

### Established Patterns
- E2E tests log in as admin using the `smoke.spec.ts` patterns or the global auth state.
- API mocks can be used if external services (Zulip, GCal) are involved in E2E tests.

### Integration Points
- `tests/e2e/`
- `functions/api/routes/`
</code_context>

<specifics>
## Specific Ideas
None.
</specifics>

<deferred>
## Deferred Ideas
None.
</deferred>
