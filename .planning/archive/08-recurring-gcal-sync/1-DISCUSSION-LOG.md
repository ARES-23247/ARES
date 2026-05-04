# Phase 1 Discussion Log

## Area: Syncing Strategy
**User Selection:** Use native RRULE strings
**Notes:** Decided against expanding instances to prevent database bloat and sync complexity.

## Area: Exception Handling
**User Selection:** Isolate & Detach
**Notes:** Decided to mimic Google Calendar's behavior by creating single-instance overrides with `parent_event_id` to prevent breaking the parent RRULE.

## Area: Deletion Cascade
**User Selection:** Cap with UNTIL date
**Notes:** Hard-deleting the series would wipe historical attendance. Capping with UNTIL preserves the past.
