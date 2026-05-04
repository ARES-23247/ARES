---
phase: 07
plan: 02
subsystem: PartyKit Collaboration
tags:
  - resilience
  - reconnection
  - offline-fallback
  - yjs
  - exponential-backoff
  - crdt
  - partykit
dependency_graph:
  requires:
    - phase: 06
      plan: 01
      reason: Requires PartyKit deployment from Phase 06
  provides:
    - component: CollaborativeEditorRoom.tsx
      features:
        - RES-01: Offline editing with "Changes not saved" indicator
        - RES-02: Auto-sync on reconnection via Yjs CRDT merge
        - Exponential backoff reconnection (5s, 10s, 20s, 40s, 60s)
        - Manual reconnect button after 5 failed attempts
  affects:
    - component: BlogEditor.tsx
      reason: Inherits reconnection resilience
    - component: DocsEditor.tsx
      reason: Inherits reconnection resilience
    - component: EventEditor.tsx
      reason: Inherits reconnection resilience
    - component: TaskDetailsModal.tsx
      reason: Inherits reconnection resilience

tech_stack:
  added:
    - library: y-partykit/provider
      usage: WebSocket reconnection via new provider instances
    - library: yjs
      usage: CRDT auto-merge on reconnect
  patterns:
    - Exponential backoff reconnection with max attempts
    - React state management for reconnection UI
    - Event-driven connection lifecycle (synced, connection-close, connection-error)

key_files:
  created: []
  modified:
    - path: src/components/editor/CollaborativeEditorRoom.tsx
      changes:
        - Added RECONNECT_DELAYS constant (5s, 10s, 20s, 40s, 60s)
        - Added MAX_RECONNECT_ATTEMPTS constant (5)
        - Added reconnectAttempt state
        - Added isReconnecting state
        - Added reconnectTimeoutRef ref
        - Added attemptReconnect function with exponential backoff
        - Added handleManualReconnect function
        - Added connection-close event handler
        - Updated StatusBadge with reconnection props and UI
        - Added cleanup for reconnectTimeoutRef
      exports:
        - CollaborativeEditorRoom (unchanged signature)
        - useCollaborativeEditor (unchanged signature)
        - ConnectedEditorRoom (internal component with reconnection state)
        - StatusBadge (internal component with reconnection UI)

decisions:
  - id: D-02-01
    title: Exponential backoff for reconnection delays
    rationale: Prevents overwhelming the server with rapid reconnection attempts while providing responsive recovery
    alternatives_considered:
      - Fixed delay: Too simple, doesn't adapt to network conditions
      - Random jitter: Adds complexity, not needed for single-client reconnection
  - id: D-02-02
    title: Max 5 reconnection attempts before manual button
    rationale: Balances UX (automatic recovery) with user control (manual reconnect after persistent failures)
    alternatives_considered:
      - Infinite reconnection: Could cause battery drain and confusion
      - Fewer attempts: Too aggressive for poor network conditions
  - id: D-02-03
    title: New provider instance for each reconnection
    rationale: y-partykit/provider does not have a built-in reconnect method; creating a new instance is the recommended approach
    alternatives_considered:
      - Reuse existing provider: No API to trigger reconnection on existing instance
      - Custom WebSocket wrapper: Adds complexity, vendor lock-in

metrics:
  duration:
    start: "2026-05-04T16:30:00Z"
    end: "2026-05-04T16:45:00Z"
    duration_minutes: 15
  completed_date: "2026-05-04"
  tasks_completed: 1
  files_modified: 1
  commits:
    - hash: "86ae811"
      message: "feat(07-02): add exponential backoff reconnection logic to CollaborativeEditorRoom"
---

# Phase 07 Plan 02: Resilience - PartyKit Reconnection Logic Summary

**One-liner:** Implemented exponential backoff reconnection with offline fallback for PartyKit collaborative editing, ensuring users can continue editing during network outages and changes auto-sync on reconnect.

## Overview

This plan added resilience to the PartyKit real-time collaboration system by implementing automatic reconnection with exponential backoff and a manual reconnect button after failed attempts. The offline state now displays a "Changes not saved" indicator, and Yjs CRDT automatically merges changes when connection recovers.

## Implementation Summary

### Task 1: Add exponential backoff reconnection logic to CollaborativeEditorRoom

**Status:** Complete

**Changes made to `src/components/editor/CollaborativeEditorRoom.tsx`:**

1. **Constants added:**
   - `RECONNECT_DELAYS = [5000, 10000, 20000, 40000, 60000]` - Exponential backoff sequence
   - `MAX_RECONNECT_ATTEMPTS = 5` - Maximum automatic reconnection attempts

2. **State added to `ConnectedEditorRoom`:**
   - `reconnectAttempt` - Tracks current attempt number (0-5)
   - `isReconnecting` - Tracks active reconnection state
   - `reconnectTimeoutRef` - Ref for reconnection timeout cleanup

3. **Functions added:**
   - `attemptReconnect()` - Handles reconnection with exponential backoff
   - `handleManualReconnect()` - Handles user-triggered reconnection with reset counter

4. **Event handlers added:**
   - `connection-close` event handler triggers auto-reconnect
   - `connection-error` event handler increments attempt counter and triggers next attempt

5. **StatusBadge enhancements:**
   - Shows "Live" badge when connected
   - Shows "Offline" badge with "Changes not saved" text when disconnected
   - Shows "Reconnecting... (X/5)" progress during reconnection attempts
   - Shows "Reconnect" button after 5 failed attempts

6. **Cleanup:**
   - Added `reconnectTimeoutRef` cleanup to prevent memory leaks

## Verification Results

All automated verification checks passed:

```
RECONNECT_DELAYS constant: Line 26
MAX_RECONNECT_ATTEMPTS constant: Line 28
attemptReconnect function: Lines 110-147
handleManualReconnect function: Lines 150-179
connection-close handler: Lines 74-79
"Changes not saved" text: Line 238
"Reconnect" button: Line 251
```

## Deviations from Plan

**None** - Plan executed exactly as written.

## Known Stubs

**None** - All functionality is implemented. No placeholder values or TODO comments found.

## Threat Flags

**None** - No new security surface beyond the existing PartyKit WebSocket connection. The reconnection logic uses the same YPartyKitProvider instantiation pattern and operates within the existing trust boundary (client to PartyKit). The threat mitigations from the plan remain valid:
- T-07-04: Exponential backoff + MAX_RECONNECT_ATTEMPTS prevents infinite reconnection loops
- T-07-05: Yjs CRDT stores changes locally and syncs on reconnect (no data loss)

## Self-Check: PASSED

- [x] Modified file exists: `src/components/editor/CollaborativeEditorRoom.tsx`
- [x] Commit exists: `86ae811`
- [x] All verification checks passed
- [x] No stubs found
- [x] No new security threats introduced

## Requirements Satisfied

- [x] **RES-01:** Editor shows Offline badge and allows editing when PartyKit unreachable
- [x] **RES-02:** Connection recovery triggers auto-sync without page reload (Yjs CRDT merge)
- [x] After 5 failed attempts, manual Reconnect button appears
