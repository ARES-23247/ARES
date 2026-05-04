# Phase 13: Interactive Tools Foundation — Context

**Date:** 2026-05-04
**Status:** Discussed — ready for planning

## <domain>

Establish a first-class interactive tools architecture within ARESWEB to support standalone utility tools (scouting, kinematics calculators, etc.) that are distinct from the existing SimulationPlayground sandbox. Tools have individual access controls (public vs. auth-gated) and integrate into the site navigation.

</domain>

## <decisions>

### Tool Architecture
- **Standalone pages, NOT SimPlayground sims.** Each tool is a first-class React component with its own route, not an iframe-sandboxed sim.
- SimPlayground remains exclusively for "vibe coding" simulations (AI-generated, sandboxed, experimental).
- New tools get proper pages in `DashboardRoutes.tsx` (private) or public routes (public).
- Tools should be lazy-loaded for code-splitting.

### Scouting Tool (Primary Tool — Phase 13 MVP)
- **Data sources:** The Orange Alliance (TOA) API + FTC Events API (FIRST official).
- **AI engine:** Z.ai GLM 5.1 for predictions and analysis.
- **MVP scope:** Pull match/team data from TOA + FTC Events, run AI analysis to generate predictions and team breakdowns.
- **Future scope (not Phase 13):** Real-time scouting data entry at events, in-depth alliance-pick strategy, historical trend analysis.
- **Access:** Auth-gated (private). Rationale: AI API cost control (prevent Denial-of-Wallet from public traffic) and competitive advantage (scouting analysis is team intel).

### Access Model
- Per-tool `isPublic` flag in the tool registry.
- Private tools: auth-required, rendered behind the dashboard auth boundary.
- Public tools: accessible without login.
- Scouting tool specifically is PRIVATE (AI costs + competitive value).

### Navigation & Discovery
- **Private tools:** Individual sidebar entries in the dashboard (like "Sim Playground" currently).
- **Public tools:** Placed in appropriate header dropdown menus (e.g., under "Team" or a new "Tools" dropdown).
- No separate "Tools hub" page needed initially — sidebar entries are sufficient.

</decisions>

## <deferred>

- Real-time scouting data entry (manual observation input during matches) — future phase
- Alliance-pick strategy optimizer — future phase
- Historical trend analysis across seasons — future phase
- Public tool examples (kinematics calculators, etc.) — future phase after scouting MVP

</deferred>

## <canonical_refs>

- `src/components/SimulationPlayground.tsx` — Existing sim sandbox (NOT to be extended for tools)
- `src/components/dashboard/DashboardRoutes.tsx` — Dashboard routing (add new tool routes here)
- `src/sims/` — Existing sim directory (tools go in a new `src/tools/` directory instead)
- `src/components/editor/TelemetryPanel.tsx` — Existing telemetry pattern (may be reusable)
- TOA API: https://the-orange-alliance.github.io/TOA-Docs/openapi.yml
- FTC Events API: https://ftc-events.firstinspires.org/
- Z.ai GLM 5.1 — AI model for predictions (routed through existing AI backend patterns)

</canonical_refs>

## <code_context>

### Reusable Patterns
- **Dashboard routing:** `DashboardRoutes.tsx` uses `lazy()` imports with role-based access guards (`canSeeSimulations` pattern). New tools follow the same pattern.
- **AI backend:** Existing `/api/ai/` routes handle Z.ai integration. Scouting predictions route through the same pattern.
- **API proxy pattern:** External API calls (TOA, FTC Events) should be proxied through Cloudflare Workers to avoid CORS and protect API keys.
- **Sidebar navigation:** Dashboard sidebar in the layout component has section groupings (Personal, Team Workspace, Quick Create, Content Hub). Tools can be added as a new section or under Team Workspace.

### New Architecture Needed
- Tool registry system (array/config defining available tools with metadata: name, route, icon, isPublic, component)
- API proxy routes for TOA and FTC Events APIs
- Scouting-specific AI prompt engineering for team analysis

</code_context>
