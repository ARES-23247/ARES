---
mapped_date: 2026-04-28
---
# Coding Conventions

## Language & Types
- Strict TypeScript enforcement across the repository.
- Use `Zod` for all runtime validation.
- End-to-end type safety via `ts-rest`. Avoid using `any`.

## Backend
- Handlers should not directly execute SQL using string interpolation; always use the `Kysely` query builder.
- Asynchronous tasks that don't need to block the response (like notifications) should use `c.executionCtx.waitUntil()`.

## Frontend
- Styling is done via Tailwind CSS classes using the `cn()` utility (`tailwind-merge` + `clsx`).
- State management relies on `React Query` for server state and `Zustand` for complex client state.

## Git & PRs
- Adhere to the `aresweb-pr-workflow` skill for committing and opening Pull Requests via GitHub CLI.
