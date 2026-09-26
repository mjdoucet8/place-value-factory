ALTER TABLE pvf_attempt DROP CONSTRAINT IF EXISTS pvf_attempt_kind_check;
ALTER TABLE pvf_attempt ADD CONSTRAINT pvf_attempt_kind_check CHECK (kind IN ('path', 'practice', 'replay'));
ALTER TABLE pvf_attempt ADD COLUMN skipped_orders INTEGER NOT NULL DEFAULT 0 CHECK (skipped_orders >= 0);
