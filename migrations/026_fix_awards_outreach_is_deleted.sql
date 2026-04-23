-- 026_fix_awards_outreach_is_deleted.sql
-- Add missing is_deleted columns to awards and outreach_logs tables if they are missing

-- Check if is_deleted exists in outreach_logs (SQLite doesn't support IF NOT EXISTS in ALTER TABLE)
-- We'll just run them and ignore errors if they already exist, but for a cleaner approach
-- we can use a script. However, wrangler d1 execute will fail on error.
-- So we'll try to add it.

ALTER TABLE outreach_logs ADD COLUMN is_deleted INTEGER DEFAULT 0;
ALTER TABLE awards ADD COLUMN is_deleted INTEGER DEFAULT 0;
ALTER TABLE awards ADD COLUMN id_new TEXT; -- If we want to move to UUIDs later, but for now let's just fix is_deleted

-- Also fix awards id type if needed, but the current error is just about is_deleted.
