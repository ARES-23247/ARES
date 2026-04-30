---
milestone: v4.5
name: Next Milestone
status: planning
progress:
  phases_total: 0
  phases_completed: 0
  tasks_total: 0
  tasks_completed: 0
---

# Project State

## Current Position

Phase: None active — awaiting v4.5 planning
Plan: —
Status: Ready for next milestone
Last activity: 2026-04-30 — v4.4 shipped (AI Copilot & CI Stabilization)

## Accumulated Context

### Active Blockers
- None

### Deferred Debt
- TODO: Fix Playwright headless WebGL crashes for RobotViewer component in TechStack.tsx. Currently commented out.
- TODO: Remove CI sourcemap diagnostic step after 5+ consecutive green CI runs.
- TODO: Add `BETTER_AUTH_SECRET` CI secret to suppress auth fallback warnings in E2E logs.

### Cross-Phase Decisions
- Using Stripe Checkout to handle PCI compliance and mobile wallet payments.
- Using Cloudflare D1 for inventory management and order fulfillment tracking.
- The 3D robot viewer is deferred until an environment configuration for headless WebGL is established.
- GlobalRAGChatbot MUST be lazy-loaded (`React.lazy()`) — eager import causes TDZ crashes in production builds.
- manualChunks: syntax/highlight packages MUST stay in the `markdown` chunk to prevent circular chunk dependencies (`syntax → markdown → syntax`).
- CI E2E uses `wrangler.ci.toml` swap strategy — `wrangler pages dev` does NOT support `--config` flag.
- All `manualChunks` path matching must normalize separators with `id.replace(/\\/g, '/')` for cross-platform consistency.
