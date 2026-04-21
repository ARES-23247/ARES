-- Add students_count to outreach_logs
ALTER TABLE outreach_logs ADD COLUMN students_count INTEGER DEFAULT 0;

-- Rename columns in outreach_logs for consistency with frontend/API if needed, 
-- but we can also just use aliases in the queries to avoid complex migrations.
-- Let's stick to adding students_count for now.
