---
gsd_state_version: 1.0
milestone: v5.6
milestone_name: "Stability & Polish"
status: in_progress
last_updated: "2026-05-03T21:33:00.000Z"
last_activity: 2026-05-03
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 3
  completed_plans: 3
  percent: 100
---

# System State

**Current Milestone**: v5.6 — Stability & Polish (In Progress)
**Current Phase**: Phases 1–3 completed
**Status**: in_progress

## Context

ARESWEB has completed Milestone v5.5 (Kanban, Science Corner & Recurring Events). 
This milestone introduced the official GitHub simulation loading feature, a massive expansion to the Science Corner sandbox with hybrid engine wrappers (Matter.js & Dyn4j), robust end-to-end (e2e) tests for authentication, and recurring calendar events with frequency limiters. Additionally, it unified the Kanban Subteams and delivered an automated Zulip User Auditor inside the Admin Dashboard.

Milestone v5.6 focuses on stability, polish, and bug fixes.

## Current Focus

1. ✅ Phase 1: Fix media uploader — completed 2026-05-03
2. ✅ Phase 2: Bypass ts-rest-hono multipart parser — completed 2026-05-03
3. ✅ Phase 3: Fix delete/move wildcard routing — completed 2026-05-03

## Completed Phases

### Phase 1 — Fix media uploader (ts-rest FormData contract)
- **Root cause**: `mediaContract.ts` upload route lacked `contentType: "multipart/form-data"`, causing ts-rest to JSON.stringify the FormData body into `"{}"`. Backend always received empty body → 400 "No file uploaded".
- **Fix**: Added `contentType: "multipart/form-data"` to the contract.
- **Additional**: Integrated `compressImage` into the bulk upload pipeline, added verbose diagnostic error logging (HTTP status, error body, file sizes).
- **Files changed**: `shared/schemas/contracts/mediaContract.ts`, `src/hooks/useMedia.ts`, `src/hooks/useMedia.test.tsx`, `src/components/assets/AssetUploader.tsx`, `src/components/AssetManager.tsx`
- **Commits**: `8f98975`, `2ecd939`, `84bcfff`, `fcb9fbb`

### Phase 2 — Bypass ts-rest-hono broken multipart parser (server-side)
- **Root cause**: `ts-rest-hono` v0.5's `validateRequest` does an exact `.includes()` match on `Content-Type` against `["multipart/form-data"]`, but browsers send `multipart/form-data; boundary=...`. The boundary suffix causes the match to fail, so the framework tries `JSON.parse()` on the raw multipart binary, which throws.
- **Fix**: Registered a raw Hono `POST /admin/upload` route **before** `createHonoEndpoints`, using Hono's native `c.req.parseBody()`. This route takes priority and completely bypasses ts-rest-hono's broken body parser.
- **Files changed**: `functions/api/routes/media/index.ts`
- **Commit**: `5568447`

### Phase 3 — Fix delete/move for R2 keys containing slashes
- **Root cause**: R2 keys contain folder slashes (e.g., `Library/image.png`). The ts-rest contract uses `DELETE /admin/:key`, but `:key` only matches a single URL path segment. A key like `Library/image.png` produces `/admin/Library/image.png`, which Hono interprets as two separate segments.
- **Fix**: Added a raw Hono `DELETE /admin/:key{.+$}` route (wildcard regex that captures everything including slashes) before `createHonoEndpoints`, plus `encodeURIComponent(key)` on the client for both delete and move mutations.
- **Files changed**: `functions/api/routes/media/index.ts`, `src/hooks/useMedia.ts`
- **Commit**: `d82ac50`

## Next Steps

- Define additional phases for v5.6 or begin planning the next milestone.

## Current Position

Phase: 3 (completed)
Plan: —
Status: Awaiting next phase
Last activity: 2026-05-03 — Fixed delete/move wildcard routing for R2 keys
