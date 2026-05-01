# Phase 83: fix e2e errors - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Address Phase 83: Resolve the End-to-End (E2E) errors identified during testing.
Currently failing tests:
- `auth.spec.ts`: Dashboard shows Restricted Access gate when unauthenticated.
- `kanban.spec.ts`: Creates, edits, and moves a Kanban task.
</domain>

<decisions>
## Implementation Decisions

### Auth Test Fix
- Ensure that unauthenticated requests to `/dashboard` correctly render the "Restricted Access" gate or redirect to login. Check if the element selectors in the test match the UI.

### Kanban Test Fix
- Ensure that `getByRole('dialog', { name: 'Edit Task' })` works. Check the TaskBoardPage code to see how the edit dialog is rendered and triggered.

### Testing
- Run `npx playwright test` to verify changes.
</decisions>

<code_context>
## Existing Code Insights
- `tests/e2e/auth.spec.ts`
- `tests/e2e/kanban.spec.ts`
- `src/pages/Dashboard.tsx` or related auth guarding.
- `src/components/dashboard/kanban/*` (TaskBoardPage, KanbanBoard, etc.)
</code_context>

<specifics>
## Specific Ideas
Fix locator timeouts or missing elements caused by recent UI changes.
</specifics>
