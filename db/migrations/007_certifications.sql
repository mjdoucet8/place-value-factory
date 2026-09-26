ALTER TABLE pvf_game_profile ADD COLUMN certifications JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE pvf_attempt ADD COLUMN awarded_tier TEXT;
