# Hotfix Session: PartyKit, Roster API, & Pa11y A11y

**Date**: 2026-05-05
**Duration**: ~2 hours
**Milestone**: N/A (out-of-band production hotfix)
**Commits**: 4

---

## Issues Resolved

### 1. PartyKit Collaborative Editor — WebSocket Blocked by CSP

**Symptom**: Collaborative editor showed "Offline (Local only)" after 5s timeout. Kanban board appeared "Live" but was cosmetic only.

**Root Cause**: `index.html` had a restrictive `<meta http-equiv="Content-Security-Policy">` tag with `connect-src 'self' https://api.dicebear.com` that **blocked all `wss://` WebSocket connections** to the PartyKit server at `aresweb-partykit.thehomelessguy.partykit.dev`. The `public/_headers` file had the correct permissive `connect-src 'self' https: wss:`, but when both a `<meta>` CSP and an HTTP header CSP are present, the browser enforces **both independently** — the most restrictive one wins.

**Fix**: Aligned `index.html` CSP with `_headers`:
```diff
- connect-src 'self' https://api.dicebear.com;
+ connect-src 'self' https: wss:;
```
Also synchronized `img-src`, `style-src`, `font-src`, `frame-src`, and `worker-src` between the two CSP sources.

**Commit**: `4aab49ef` — `fix: align index.html CSP with _headers to unblock PartyKit WebSocket connections for collaborative editors`

**Verification**: User confirmed Live badge now appears on editor pages.

---

### 2. Team Roster API — Triple Schema Mismatch (500 Error)

**Symptom**: `GET /api/profile/team-roster` returned `500 Internal server error`. The `/about` page showed no team members.

**Root Cause**: Three compounding `ts-rest` response validation failures caused by `responseValidation: true` in `createHonoEndpoints()`:

| # | Issue | Detail |
|---|---|---|
| **A** | `MemberTypeEnum` incomplete | Database contained `alumni` and `sponsor` member types, but the Zod enum only listed `student`, `mentor`, `coach`, `parent`, `alumnus`, `other`. |
| **B** | Undeclared response fields | `sanitizeProfileForPublic()` returns 12+ fields (`show_on_about`, `favorite_robot_mechanism`, `leadership_role`, `name`, `role`, etc.) that weren't in the contract schema. Zod's strict `z.object()` rejects unknown keys. |
| **C** | `colleges`/`employers` type mismatch | Contract declared `z.array(z.string())` but the D1 database stores these as JSON strings like `[{"name":"Rice University","domain":"rice.edu","degree":"BA, BS"}]`. After parsing by `safeParseArray()`, they become arrays of **objects**, not strings. |

**Discovery Method**: Issue C was only found by querying the **production D1 database** directly with `wrangler d1 execute ares-db --remote` to inspect the actual data shape.

**Fixes**:
1. Added `alumni` and `sponsor` to `MemberTypeEnum`
2. Added all missing fields to the roster member schema + `.passthrough()`
3. Changed `colleges`/`employers` from `z.array(z.string())` to `z.array(z.unknown())`

**Commits**:
- `95ec1ab6` — `fix: add missing fields and .passthrough() to roster contract schema`
- `5ca15c57` — `fix: colleges/employers are arrays of objects not strings`

**Verification**: Production API returns `200` with 20 members after deploy.

---

### 3. Pa11y A11y — Events Page Color Contrast (57 Errors)

**Symptom**: Pa11y CI failing with 57 `color-contrast` violations on `/events` (15/16 URLs passed).

**Root Cause**: Calendar grid and subscription banner used `text-zinc-400` (#a1a1aa) on dark backgrounds, failing WCAG AA minimum contrast ratio of 4.5:1.

**Fixes**:
- `MonthViewGrid.tsx`: `text-zinc-400` → `text-zinc-300` for day headers and non-current-month day numbers
- `CalendarSubscriptionBanner.tsx`: `text-zinc-300` → `text-zinc-200` for banner description text

**Commit**: `2d43d7fb` — `fix(a11y): improve color contrast on calendar grid and subscription banner for WCAG AA compliance`

**Verification**: Awaiting CI re-run. Note: Some contrast errors may persist due to pa11y's inability to compute effective background color through CSS transparency layers (`bg-white/5` on `bg-obsidian`).

---

## Key Learnings

1. **CSP meta tags and HTTP headers are enforced independently** — if you have both, the browser takes the intersection. Always keep them in sync.

2. **`responseValidation: true` is a production footgun** — it silently converts any Zod validation failure into a generic 500 with no indication of which field failed. The error handler at line 276-278 of `profiles.ts` logs `err.cause` but Cloudflare Workers logs aren't easily accessible in real-time.

3. **Schema mismatches require production data inspection** — the `colleges`/`employers` type mismatch could only be found by querying the actual D1 data. The code looked correct in isolation; only real data revealed the JSON-object-vs-string discrepancy.

4. **The Kanban "Live" badge was misleading** — it showed "Live" whenever the `host` variable was truthy, not when the WebSocket was actually connected. This masked the CSP issue for weeks.

## Files Changed

| File | Change |
|------|--------|
| `index.html` | Aligned CSP meta tag with `_headers` |
| `shared/schemas/contracts/userContract.ts` | Added `alumni`/`sponsor` to enum, added missing roster fields, fixed colleges/employers types, added `.passthrough()` |
| `src/components/calendar/MonthViewGrid.tsx` | Upgraded `text-zinc-400` → `text-zinc-300` |
| `src/components/calendar/CalendarSubscriptionBanner.tsx` | Upgraded `text-zinc-300` → `text-zinc-200` |

## Technical Debt Created

- `z.array(z.unknown())` for colleges/employers is a workaround. A proper fix would define `CollegeEntry` and `EmployerEntry` Zod schemas matching the actual object shape.
- The Kanban "Live" badge should check actual WebSocket connection state, not just host truthiness.
- Response validation error handler should log the specific field path that failed, not just `err.cause`.
