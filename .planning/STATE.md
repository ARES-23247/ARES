---
gsd_state_version: 1.0
milestone: v6.4
milestone_name: Science & Math Corner Expansion
status: planning
last_updated: "2026-05-04T23:11:31.078Z"
last_activity: 2026-05-04
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# System State

**Current Milestone**: v6.3 — Outreach & Impact Logging Restoration
**Status**: active

## Current Position

Phase: 16. Save AI Scouting Analyses
Plan: —
Status: Planning
Last activity: 2026-05-04 — Milestone v6.4 started

## Completed This Session

| Phase | Plan | Description | Commits |
|-------|------|-------------|---------|
| 06 | - | PartyKit Production Deployment | `0dc2c0e`, `6b0604a` |
| 06.5 | - | Editor UI & Zulip Fixes | `0dc2c0e`, `30e17a8` |
| 07 | 03 | PartyKit D1 Snapshot Persistence | `f2618f8` |
| 08 | 01 | Media Manager E2E Testing | `96ae0b9`, `7acce7e`, `a5ac018` |
| 08 | - | Accessibility & Layout Fixes (Ad-hoc) | `ec2e66a`, `2dfffca` |
| 09 | 01 | Media Manager & Zulip E2E Testing | `a70449d` |
| - | - | fix(footer): replace malformed TikTok/Bluesky SVGs (CI fix) | `e09257b` |
| - | - | feat(outreach): season tabs + always-visible card stats | `5f62735` |
| - | - | fix(deploy): inject VITE_PARTYKIT_HOST for collab editing | `bc8196a` |
| 13 | 01 | Tool registry, scouting API proxies, AI analysis endpoint | `c7afbca` |
| 13 | 02 | FTC Scouting Tool UI with AI analysis integration | `03c6b82` |

## Key Decisions

- **D1 shared database:** PartyKit uses same ares-db as main app via separate PK_DB binding (simplifies backup, avoids duplication)
- **Base64 state encoding:** YDoc Uint8Array encoded as base64 for D1 BLOB storage
- **Snapshot persistence mode:** Full state saved on last client disconnect with 1-second debounce
- **E2E auth mocking pattern:** Mock /api/auth/get-session and /profile/me with admin user, add better-auth.session_token cookie, set __PLAYWRIGHT_TEST__ flag (from kanban.spec.ts)
- **Social queue architecture:** Scheduled posts stored in `social_queue` table with cron worker processing; integrated with existing `dispatchSocials` utility
- **PartyKit build injection:** VITE_PARTYKIT_HOST must be explicitly set in deploy.yml build step (Vite doesn't reliably read .env.production in CI)
- **Outreach season tabs:** Client-side filtering via season_id; tabs auto-populate from seasons that have linked logs
- **Scouting API architecture:** Server-side proxy pattern (TOA/FTC Events) prevents client API key leakage; tool registry with isPublic flag for access control
- **AI scouting analysis:** Three modes (team_analysis, match_prediction, event_overview) using Z.ai GLM 5.1 with structured system prompts

## Deferred Items

| Category | Item | Source | Status |
|----------|------|--------|--------|
| requirement | Social Media Manager | Ad-hoc request | COMPLETE - needs GSD documentation |
| requirement | TEST-03 (media manager E2E) | v5.7 | COMPLETE - 08-01 |
| requirement | MON-03 (usage metrics dashboard) | v5.7 | In progress - 08-02 |
| todo | audit-portfolio-pages.md | v5.9 | Pending |
| todo | curate-initial-experiments.md | v5.9 | Pending |
| todo | review-docs-page.md | v5.9 | Pending |
| investigation | Zulip account sync with aresfirst.org | v6.0 — user-reported | Pending - 08-03 |
