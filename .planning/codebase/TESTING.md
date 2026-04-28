---
mapped_date: 2026-04-28
---
# Testing Practices

## Frameworks
- **Unit/Integration Testing:** `Vitest` (with V8 coverage).
- **E2E Testing:** `Playwright` (`@playwright/test`).
- **Accessibility:** `pa11y-ci` and `@axe-core/playwright`.

## Backend Testing Patterns
- Test files reside alongside their implementation (`route.test.ts`).
- **Mocking:** Kysely query builders are heavily mocked using `vi.fn().mockImplementation()`. 
- **Middlewares:** Auth and RBAC middleware are mocked in `functions/api/routes/__mocks__` or at the top of test files using `vi.mock()`.

## Coverage Rules
- **CRITICAL:** The project enforces a strict **100% Function Coverage** threshold for the backend API.
- CI/CD will block deployments if function coverage drops below 100%.
