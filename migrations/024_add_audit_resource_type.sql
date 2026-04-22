-- Migration 024: Add resource_type to audit_log
-- Required for the new unified audit system when saving blog posts, events, etc.
ALTER TABLE audit_log ADD COLUMN resource_type TEXT NOT NULL DEFAULT 'unknown';
