# Phase 7: Testing

## Goal
E2E coverage & unit tests for the Zulip audit, Calendar repair, and Media multipart uploader.

## Implementation Steps

### 1. Unit Tests for Handlers
- **Target**: `functions/api/routes/__tests__/calendar.test.ts`
- **Action**: Add unit tests for the `/repair` endpoint, mocking the Google Calendar API calls and DB queries.
- **Target**: `functions/api/routes/__tests__/zulip.test.ts`
- **Action**: Add unit tests for the `/audit` endpoint, mocking the Zulip API calls.
- **Target**: `functions/api/routes/__tests__/media.test.ts`
- **Action**: Add unit tests for the `/multipart` fallback upload, mocking R2.

### 2. E2E Tests for UI Flows
- **Target**: `tests/e2e/calendar.spec.ts`
- **Action**: Test the Calendar repair UI on the dashboard.
- **Target**: `tests/e2e/zulip.spec.ts`
- **Action**: Test the Zulip audit UI on the dashboard.
- **Target**: `tests/e2e/media.spec.ts`
- **Action**: Test the R2 media uploader fallback path.

## Verification
- Run `npm run test` for unit tests.
- Run `npx playwright test` for E2E tests.
