-- Migration: Add revision_of column to content tables for shadow revisions
-- Created: 2026-04-24

ALTER TABLE posts ADD COLUMN revision_of TEXT;
ALTER TABLE events ADD COLUMN revision_of TEXT;
ALTER TABLE docs ADD COLUMN revision_of TEXT;

-- Index for faster lookup of revisions
CREATE INDEX IF NOT EXISTS idx_posts_revision_of ON posts(revision_of);
CREATE INDEX IF NOT EXISTS idx_events_revision_of ON events(revision_of);
CREATE INDEX IF NOT EXISTS idx_docs_revision_of ON docs(revision_of);
