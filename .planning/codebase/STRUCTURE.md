---
mapped_date: 2026-04-28
---
# Directory Structure

## Overview
```
/
├── .planning/       # GSD project planning artifacts
├── functions/       # Cloudflare Pages Functions (Backend)
│   ├── api/         # Core API logic
│   │   └── routes/  # Domain-specific Hono handlers
│   └── utils/       # Backend utilities (auth, tiptap processing)
├── src/             # React Frontend
│   ├── components/  # Reusable UI components
│   ├── hooks/       # Custom React hooks
│   └── utils/       # Frontend utilities
├── shared/          # Code shared between frontend and backend
│   └── api/         # ts-rest contracts and Zod schemas
├── migrations/      # D1 SQL migrations
├── schema.sql       # Source of truth for database schema
└── scripts/         # Automation and utility scripts
```

## Naming Conventions
- Backend handlers are named by their domain (e.g., `tasks.ts`, `posts.ts`).
- React components use PascalCase (`Turnstile.tsx`).
- Test files suffix with `.test.ts` or `.test.tsx`.
