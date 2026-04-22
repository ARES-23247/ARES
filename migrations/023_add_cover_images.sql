-- Migration 023: Add thumbnail and cover_image
-- Adds the thumbnail column to posts and cover_image to events
-- This mirrors what was already consolidated into schema.sql but might be missing from live production.

-- Safe ADD COLUMN using a TRY block (since SQLite doesn't support IF NOT EXISTS for ADD COLUMN directly, 
-- but Wrangler D1 will execute it. If the column exists, it will fail but we document it).

ALTER TABLE posts ADD COLUMN thumbnail TEXT;
ALTER TABLE events ADD COLUMN cover_image TEXT;
