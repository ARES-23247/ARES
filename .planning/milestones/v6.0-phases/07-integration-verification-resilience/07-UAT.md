---
status: partial
phase: 07-integration-verification-resilience
source: [.planning/phases/07-integration-verification-resilience/07-01-SUMMARY.md, .planning/phases/07-integration-verification-resilience/07-02-SUMMARY.md, .planning/phases/07-integration-verification-resilience/07-03-SUMMARY.md]
started: 2026-05-04T17:00:00Z
updated: 2026-05-04T17:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Start the dev server from a stopped state. The application boots without errors and the homepage loads successfully.
result: pass

### 2. Live Badge on All Editors
expected: Navigate to any editor (Blog, Docs, Events, Tasks) and verify a green "Live" badge appears, indicating PartyKit connection is active.
result: blocked
blocked_by: server
reason: "unable to test on local host"

### 3. Multi-User Connectivity
expected: Open the same document in two separate browser tabs. Both tabs should show the "Live" badge, confirming both users are connected to the PartyKit room.
result: blocked
blocked_by: server
reason: "can't test on local host"

### 4. Document Persistence After Reload
expected: Edit a document in any editor, then refresh the page. The document content should remain and the "Live" badge should reappear.
result: blocked
blocked_by: server
reason: "can't test on local host"

### 5. Offline Mode Indicator
expected: Disconnect your network or stop the PartyKit server. The editor should show an "Offline" badge with "Changes not saved" text, but allow continued editing.
result: blocked
blocked_by: server
reason: "can't test on local host"

### 6. Auto-Reconnect with Exponential Backoff
expected: After losing connection, verify the badge shows "Reconnecting... (1/5)", "Reconnecting... (2/5)" etc., with delays increasing (5s, 10s, 20s, 40s, 60s).
result: blocked
blocked_by: server
reason: "can't test on local host"

### 7. Manual Reconnect Button
expected: After 5 failed reconnection attempts, a "Reconnect" button should appear. Clicking it should restart the reconnection sequence.
result: blocked
blocked_by: server
reason: "can't test on local host"

### 8. D1 Snapshot Persistence
expected: Make edits in an editor, then run `npx wrangler d1 execute ares-db --local --command "SELECT room_id, length(state) as state_size, updated_at FROM document_snapshots ORDER BY updated_at DESC LIMIT 5"` to verify snapshots are saved to D1.
result: blocked
blocked_by: server
reason: "can't test on local host"

### 9. Cross-Server-Restart Persistence
expected: Make edits in an editor, run `npx partykit deploy` to restart the server, then refresh the editor. Your changes should persist from D1.
result: blocked
blocked_by: server
reason: "can't test on local host"

## Summary

total: 9
passed: 1
issues: 0
pending: 0
skipped: 0
blocked: 8

## Gaps

none yet
