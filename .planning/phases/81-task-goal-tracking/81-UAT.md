---
status: testing
phase: 81-task-goal-tracking
source: 
  - 81-SUMMARY.md
started: 2026-05-01T20:42:00Z
updated: 2026-05-01T20:42:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 2
name: Fullscreen Toggle
expected: |
  Clicking the "Fullscreen" button on the Task Board expands the Kanban board to take up the entire screen, acting as an overlay over the standard dashboard layout. Clicking "Exit Fullscreen" restores it.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch (`npm run dev`). Server boots without errors, database migrations/types generate successfully, and the Task Board loads live data successfully.
result: pass

### 2. Fullscreen Toggle
expected: Clicking the "Fullscreen" button on the Task Board expands the Kanban board to take up the entire screen, acting as an overlay over the standard dashboard layout. Clicking "Exit Fullscreen" restores it.
result: pending

### 3. Task Edit Drawer
expected: Clicking on an existing task opens a slide-out drawer from the right side of the screen instead of a center modal. The user can still see the kanban board underneath the drawer's shadow.
result: pending

### 4. Subteam Selection
expected: Inside the Task Edit Drawer, there is a "Subteam" dropdown. Selecting a subteam (e.g., Hardware, Software) and clicking Save successfully updates the task. When re-opening the drawer, the saved subteam is still selected.
result: pending

### 5. Liveblocks Presence
expected: When multiple users (or two different browser tabs) view the Task Board simultaneously, their cursors and avatars are visible to each other in real-time.
result: pending

## Summary

total: 5
passed: 1
issues: 0
pending: 4
skipped: 0

## Gaps

