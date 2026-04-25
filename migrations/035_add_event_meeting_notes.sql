-- Migration 035: Add meeting notes to events
ALTER TABLE events ADD COLUMN meeting_notes TEXT;
