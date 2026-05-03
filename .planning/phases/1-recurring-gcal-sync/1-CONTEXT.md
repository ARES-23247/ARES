# Phase 1: Recurring GCal Sync

## Domain
Establish bidirectional sync for recurring events (pushing the full series to Google Calendar instead of just the first instance).

## Canonical Refs
- No specific external ADRs or specs referenced for this phase.

## Decisions Captured

### Syncing Strategy
- **Decision:** Use native `RRULE` strings. Store the recurring event as a single row in D1 with a `recurrence_rule` column (e.g., `FREQ=WEEKLY;BYDAY=MO,WE,FR`), and pass that exact string to the Google Calendar API.

### Exception Handling
- **Decision:** Isolate & Detach. When someone edits or cancels a single instance of a recurring practice, ARESWEB should create a new, isolated event in D1 that references the parent series via a `parent_event_id`. This aligns with GCal's `recurringEventId` and `originalStartTime`.

### Deletion Cascade
- **Decision:** Cap with an `UNTIL` date (Delete future only). If a mentor deletes a recurring event series, do not hard-delete it. Instead, append an `UNTIL=[Today]` modifier to the `RRULE`. This preserves historical attendance data for past practices while clearing the future calendar.

## Deferred Ideas
- None captured during discussion.

## Code Context
- Reusable assets: existing Google Calendar sync logic in `admin/sync`, existing `events` schema.
