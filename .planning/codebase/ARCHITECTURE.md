---
mapped_date: 2026-04-28
---
# Architecture

## High-Level Pattern
ARESWEB follows a decoupled full-stack architecture running entirely on the Cloudflare edge network. The frontend is a Single Page Application (SPA) built with React/Vite, while the backend is an edge-native API built with Hono.

## Data Flow
1. **Client:** React components fetch data using `@ts-rest/react-query`.
2. **Contract:** `shared/api/` contains the strict Zod/ts-rest definitions for all routes.
3. **API:** Hono handlers (`functions/api/routes/`) receive requests and validate them using `ts-rest-hono`.
4. **Database:** Kysely executes optimized SQL queries against Cloudflare D1.

## Key Abstractions
- **ts-rest routers:** The backend is split into domain-specific ts-rest router objects (e.g., `tasksTsRestRouterObj`, `financeTsRestRouterObj`).
- **Middleware:** Auth and Role-Based Access Control (RBAC) are handled by Hono middleware before reaching the core ts-rest logic.
