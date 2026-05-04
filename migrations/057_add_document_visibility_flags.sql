-- 057_add_document_visibility_flags.sql
ALTER TABLE docs ADD COLUMN display_in_areslib INTEGER DEFAULT 0;
ALTER TABLE docs ADD COLUMN display_in_math_corner INTEGER DEFAULT 0;
ALTER TABLE docs ADD COLUMN display_in_science_corner INTEGER DEFAULT 0;

-- Existing documents should remain visible in areslib
UPDATE docs SET display_in_areslib = 1;
