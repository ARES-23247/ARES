---
mapped_date: 2026-04-28
---
# External Integrations

## Communication
- **Zulip:** Used for internal team notifications (e.g., task assignments, post reviews). Configured via `functions/api/routes/zulip.ts`.
- **Resend:** Used for outbound mass email communication (`functions/api/routes/communications.ts`).

## Developer & Ops
- **GitHub Webhooks:** Receives repository events (`functions/api/routes/githubWebhook.ts`).
- **Cloudflare AI:** Utilized for AI processing (`@cloudflare/ai`).

## Authentication Providers
- **Better-Auth:** Manages user sessions, OAuth integrations, and role-based access control. Connects to Kysely via `@better-auth/kysely-adapter`.
