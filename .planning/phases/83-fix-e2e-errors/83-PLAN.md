# Phase 83: fix e2e errors - Plan

## Goal
Resolve the End-to-End (E2E) errors identified in the Playwright suite.

## Proposed Changes

### 1. Fix Auth Spec (`tests/e2e/auth.spec.ts`)
- Identify why the dashboard doesn't show the "Restricted Access" gate when unauthenticated.
- It could be a mismatch between the test selector (e.g., waiting for text "Restricted Access") and the actual page implementation (maybe it redirects to `/login` now?).
- Update the test or the routing logic as appropriate to match the current intended behavior.

### 2. Fix Kanban Spec (`tests/e2e/kanban.spec.ts`)
- Identify why `getByRole('dialog', { name: 'Edit Task' })` fails to appear.
- Check if the task interaction (clicking to edit) has changed (e.g., now requiring double click, or the dialog name has changed, or there is an error in rendering).
- Update the Kanban test to correctly locate and interact with the edit dialog.

## Verification Plan
Run `npx playwright test tests/e2e/auth.spec.ts tests/e2e/kanban.spec.ts` and ensure both pass successfully.
