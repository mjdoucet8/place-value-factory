-- Additional runtime state is normalized by entity; no whole-database JSON blob.
ALTER TABLE pvf_game_profile ADD COLUMN access_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE pvf_attempt ADD COLUMN kind TEXT NOT NULL DEFAULT 'path' CHECK (kind IN ('path','practice'));
ALTER TABLE pvf_attempt ADD COLUMN practice_skill TEXT;
ALTER TABLE pvf_attempt ADD COLUMN replacement_index INTEGER NOT NULL DEFAULT 0 CHECK (replacement_index >= 0);
ALTER TABLE pvf_attempt ADD COLUMN transfer_star BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pvf_attempt ADD COLUMN active_order_id TEXT;
ALTER TABLE pvf_attempt ADD COLUMN transfer_order_id TEXT;
ALTER TABLE pvf_attempt ADD CONSTRAINT pvf_active_order_owner FOREIGN KEY (active_order_id, student_id) REFERENCES pvf_order(id, student_id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE pvf_attempt ADD CONSTRAINT pvf_transfer_order_owner FOREIGN KEY (transfer_order_id, student_id) REFERENCES pvf_order(id, student_id) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE pvf_command_receipt ADD COLUMN attempt_id UUID REFERENCES pvf_attempt(id) ON DELETE CASCADE;
-- Command keys are actor-scoped in receipts, not globally unique across students.
ALTER TABLE pvf_response DROP CONSTRAINT pvf_response_command_id_key;
ALTER TABLE pvf_response ADD CONSTRAINT pvf_response_order_command UNIQUE(order_id, command_id);
CREATE TABLE pvf_support_event (
  order_id TEXT NOT NULL REFERENCES pvf_order(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('H1','H2','H3')),
  committed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (order_id,step)
);
