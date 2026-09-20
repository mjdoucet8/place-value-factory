-- Place Value Factory v1 durable game state. Apply with PostgreSQL 15+.
-- Identity remains adapter-owned: profile/student IDs are opaque UUID/text values here.

CREATE TABLE pvf_game_profile (
  student_id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pvf_attempt (
  id UUID PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES pvf_game_profile(student_id) ON DELETE CASCADE,
  level_id TEXT NOT NULL,
  seed INTEGER NOT NULL,
  slot INTEGER NOT NULL DEFAULT 0 CHECK (slot BETWEEN 0 AND 5),
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  lease_epoch INTEGER NOT NULL DEFAULT 1 CHECK (lease_epoch >= 1),
  writer_tab_id TEXT NOT NULL,
  lease_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX pvf_one_open_attempt_per_student
  ON pvf_attempt(student_id) WHERE status IN ('active', 'paused');
CREATE INDEX pvf_attempt_student_status ON pvf_attempt(student_id, status);

CREATE TABLE pvf_order (
  id TEXT PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES pvf_attempt(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL CHECK (slot_index BETWEEN 0 AND 4),
  replacement_index INTEGER NOT NULL DEFAULT 0 CHECK (replacement_index >= 0),
  role TEXT NOT NULL DEFAULT 'main' CHECK (role IN ('main', 'transfer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'skipped')),
  spec JSONB NOT NULL,
  primary_skill TEXT NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attempt_id, slot_index, replacement_index, role)
);

CREATE TABLE pvf_response (
  id UUID PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES pvf_order(id) ON DELETE CASCADE,
  command_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence >= 0),
  representation_a JSONB NOT NULL,
  representation_b JSONB,
  validation JSONB NOT NULL,
  active_ms INTEGER NOT NULL DEFAULT 0 CHECK (active_ms BETWEEN 0 AND 86400000),
  committed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id, sequence),
  UNIQUE(command_id)
);

CREATE TABLE pvf_command_receipt (
  actor_id TEXT NOT NULL,
  command_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  status INTEGER NOT NULL CHECK (status BETWEEN 200 AND 599),
  response JSONB NOT NULL,
  committed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(actor_id, command_id)
);

CREATE TABLE pvf_skill_evidence (
  id UUID PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES pvf_game_profile(student_id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE REFERENCES pvf_order(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  score NUMERIC(4,3) NOT NULL CHECK (score BETWEEN 0 AND 1),
  independent_first BOOLEAN NOT NULL,
  signature TEXT NOT NULL,
  eligible BOOLEAN NOT NULL DEFAULT TRUE,
  committed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  policy_version TEXT NOT NULL
);
CREATE INDEX pvf_evidence_skill_time ON pvf_skill_evidence(student_id, skill_id, committed_at DESC);
