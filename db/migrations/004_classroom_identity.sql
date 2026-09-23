CREATE TABLE pvf_identity (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('teacher','student')),
  username TEXT NOT NULL,
  credential_hash TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX pvf_teacher_username ON pvf_identity(username) WHERE role='teacher';
CREATE TABLE pvf_class (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES pvf_identity(id),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE pvf_student (
  id TEXT PRIMARY KEY REFERENCES pvf_identity(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES pvf_class(id),
  username TEXT NOT NULL,
  alias TEXT NOT NULL,
  UNIQUE(class_id,username)
);
CREATE TABLE pvf_session (
  token_hash TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL REFERENCES pvf_identity(id) ON DELETE CASCADE,
  csrf_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now()+interval '8 hours'
);
CREATE INDEX pvf_session_actor ON pvf_session(actor_id);
CREATE TABLE pvf_login_limit (
  bucket TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ
);
CREATE TABLE pvf_roster_receipt (
  actor_id TEXT NOT NULL REFERENCES pvf_identity(id) ON DELETE CASCADE,
  command_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  status INTEGER NOT NULL,
  response JSONB NOT NULL,
  secret_ciphertext TEXT,
  secret_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(actor_id,command_id)
);
