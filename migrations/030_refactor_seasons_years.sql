-- Migration 030: Refactor seasons table to year-based schema and add album fields

-- 1. Create the new seasons table with year-based PK
CREATE TABLE seasons_v2 (
    start_year INTEGER PRIMARY KEY, -- e.g. 2025
    end_year INTEGER, -- e.g. 2026
    challenge_name TEXT NOT NULL,
    robot_name TEXT,
    robot_image TEXT,
    robot_description TEXT, -- JSON AST
    robot_cad_url TEXT,
    summary TEXT,
    album_url TEXT,
    album_cover TEXT,
    status TEXT DEFAULT 'published',
    is_deleted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Migrate data from old seasons table
-- Attempt to extract years from the old 'id' (which was e.g. '2025-2026')
INSERT INTO seasons_v2 (
    start_year, end_year, challenge_name, robot_name, robot_image, 
    robot_description, robot_cad_url, summary, status, is_deleted, created_at, updated_at
)
SELECT 
    CAST(SUBSTR(id, 1, 4) AS INTEGER),
    CAST(SUBSTR(id, 6, 4) AS INTEGER),
    challenge_name, robot_name, robot_image, 
    robot_description, robot_cad_url, summary, status, is_deleted, created_at, updated_at
FROM seasons;

-- 3. Update foreign keys in other tables to use start_year (INTEGER)
-- Extracting the first 4 chars from the old season_id (which matched seasons.id)
UPDATE events SET season_id = CAST(SUBSTR(season_id, 1, 4) AS INTEGER) WHERE season_id IS NOT NULL;
UPDATE awards SET season_id = CAST(SUBSTR(season_id, 1, 4) AS INTEGER) WHERE season_id IS NOT NULL;
UPDATE outreach_logs SET season_id = CAST(SUBSTR(season_id, 1, 4) AS INTEGER) WHERE season_id IS NOT NULL;
UPDATE posts SET season_id = CAST(SUBSTR(season_id, 1, 4) AS INTEGER) WHERE season_id IS NOT NULL;

-- 4. Drop old table and swap
DROP TABLE seasons;
ALTER TABLE seasons_v2 RENAME TO seasons;

-- 5. Re-create indexes (D1 requires index re-creation if table is renamed/recreated)
CREATE INDEX IF NOT EXISTS idx_events_season ON events(season_id);
CREATE INDEX IF NOT EXISTS idx_awards_season ON awards(season_id);
CREATE INDEX IF NOT EXISTS idx_outreach_season ON outreach_logs(season_id);
CREATE INDEX IF NOT EXISTS idx_posts_season ON posts(season_id);
