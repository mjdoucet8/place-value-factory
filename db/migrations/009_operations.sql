ALTER TABLE pvf_class ADD COLUMN archived_at TIMESTAMPTZ;
CREATE TABLE pvf_operations_audit (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('class_archive','student_delete','retention_delete','secret_cleanup')),
  target_hash TEXT NOT NULL,
  actor_hash TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX pvf_operations_audit_created ON pvf_operations_audit(created_at);
