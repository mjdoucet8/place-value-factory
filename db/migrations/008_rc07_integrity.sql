-- Preserve practice scheduling, teacher access decisions, and exclusive transfer writing.
ALTER TABLE pvf_attempt
  ADD COLUMN practice_schedule JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE UNIQUE INDEX pvf_one_active_transfer_per_student
  ON pvf_attempt(student_id) WHERE transfer_order_id IS NOT NULL;

CREATE TABLE pvf_level_access_override (
  id UUID PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES pvf_game_profile(student_id) ON DELETE CASCADE,
  level_id TEXT NOT NULL,
  enabled BOOLEAN NOT NULL,
  reason_code TEXT NOT NULL CHECK (length(reason_code) BETWEEN 1 AND 80),
  command_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, command_id)
);
CREATE INDEX pvf_level_override_latest
  ON pvf_level_access_override(student_id, level_id, created_at DESC);
