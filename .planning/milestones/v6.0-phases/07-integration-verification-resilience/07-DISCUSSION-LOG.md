# Phase 07: Integration Verification & Resilience - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 07-integration-verification-resilience
**Areas discussed:** Test automation approach, Reconnection strategy, Cloud-prem deployment, Offline UX behavior

---

## Test Automation Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Manual browser testing only | Open 2+ browser tabs, edit same doc, verify changes sync. Fast, no code needed. PartyKit's dev server can run locally for this. | |
| Manual + Playwright E2E | Add Playwright tests that open multiple contexts/pages and verify PartyKit sync. Slower but gives CI confidence. | |
| Full Playwright multi-user | Use Playwright's `browser.context()` for multi-user simulation. Best coverage but most complex to write. | ✓ |

**User's choice:** Full Playwright multi-user
**Notes:** Will cover INT-01 (Live badge), INT-02 (multi-user sync), INT-03 (reload persistence)

---

## Reconnection Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed interval (30s) | Every 30 seconds, attempt reconnect. Simple but wasteful if server is down for hours. | |
| Exponential backoff | Start at 5s, double each attempt up to 60s max. Browser-friendly when connection flaky. | ✓ |
| Event-based (online) | Listen for browser 'online' event, then attempt reconnect. Most efficient but browser API varies. | |

**User's choice:** Exponential backoff

### Follow-up: Give up behavior

| Option | Description | Selected |
|--------|-------------|----------|
| 5 attempts, 60s cap | 5s → 10s → 20s → 40s → 60s (max). Total ~2 min before giving up. Editor stays offline. | |
| Never give up, retry forever | Keep retrying indefinitely at 60s intervals. User can reload page to reset. | |
| Manual reconnect button | Add a "Reconnect" button in the Offline badge. User controls when to retry. | |

**User's choice:** 5 attempts then the manual reconnect button
**Notes:** Exponential backoff: 5s → 10s → 20s → 40s → 60s, then show manual reconnect button in Offline badge

---

## Cloud-Prem Deployment

| Option | Description | Selected |
|--------|-------------|----------|
| Self-hosted Docker | npm run deploy:partykit deploys to Docker container. Self-hosted, full control, requires server. | |
| Cloudflare Workers | Deploy PartyKit as a Cloudflare Worker with D1 binding. Same infra as main app, no new servers. | ✓ |
| Defer to later milestone | Skip PK-03 for now. D1 snapshots are nice-to-have; local Yjs persistence works for session. | |

**User's choice:** Cloudflare Workers
**Notes:** Keeps infrastructure consistent with main app, enables D1 snapshot persistence

---

## Offline UX Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Edit normally, save on demand | Users can edit, save button works. No indication that changes are local-only. Simple but may confuse. | |
| Local-only + sync indicator | Show 'Changes not saved' indicator. Save button stores locally. Auto-sync on reconnect. Clearest UX. | ✓ |
| Read-only mode | Disable save when offline. Read-only mode. Prevents data loss but least functional. | |

**User's choice:** Local-only + sync indicator
**Notes:** Users can edit offline with "Changes not saved" indicator, auto-sync on reconnect

### Follow-up: Conflict handling

| Option | Description | Selected |
|--------|-------------|----------|
| Automatic CRDT merge | Yjs CRDT handles merges automatically. No conflict UI needed. Both sets of changes survive. | ✓ |
| Prompt user to review | Show 'unsent changes' count. On reconnect, ask user to review before sending. Safer but more friction. | |

**User's choice:** Automatic CRDT merge
**Notes:** Yjs handles conflict resolution automatically, no user intervention needed

---

## Claude's Discretion

- Exact Playwright test structure (how to simulate multiple users in same test file)
- Reconnection UI styling within existing badge design
- D1 migration details for cloud-prem PartyKit deployment

## Deferred Ideas

None — discussion stayed within phase scope
